<template>
  <q-page>
    <div class="row q-py-lg q-pl-md">

      <FiltrarCompras @actualizarLista = "actualizarLista" 
        :user="user" :formFiltrarCompras="formFiltrarCompras" />

      <div class="col-md-3 flex justify-end">
        <q-btn v-if="validarPermisos('Agregar Compra') && !$q.screen.xs"
          color="secondary" label="Agregar Compra" class="q-mr-md"
          @click=" $router.push('/compras/add')" />
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 col-xs-12">
        <div class="q-pa-md">
          <q-table
            class="table-ventas"
            :rows="rows"
            :columns="columns"
            :loading = "loading"
            row-key="name">

            <template v-slot:top>
              <label class="q-mr-xl text-h5 text-weight-regular">Listado de Compras <q-icon  name="fa fa fa-cash-register" size="30px" color="secondary"  /></label>
                <!-- <label class="q-ml-xl q-pl-xl text-subtitle1">
                  <b>TOTAL DE VENTAS:</b>
                  <q-badge outline class="q-px-md text-subtitle1 q-ml-sm text-weight-bold"
                    color="blue-grey" :label=" `$${ totalVentas.toFixed(2) }` " />
                </label> -->

                <q-space />
                <q-input dense debounce="1000" color="primary" v-model="filter">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
            </template>

            <template v-slot:body-cell-total="props">
              <q-td :props="props">
                ${{ props.row.total.toFixed(2) }}
              </q-td>
            </template>

            <template v-slot:body-cell-estado="props">
              <q-td :props="props">
                <q-badge outline class="q-py-xs q-px-md"
                    :color="( props.row.estado ) ? 'secondary' : 'negative'"
                    :label=" props.row.estado ? 'Aceptado' : 'Anulado'" />
              </q-td>
            </template>

            <template v-slot:body-cell-acciones="props">
              <q-td :props="props">
                <q-btn round color="blue-grey"
                  icon="visibility"
                  class="q-mr-sm"
                  @click="mostrarDetalleCompra( props.row )"
                  size="10px" />

                <q-btn round color="blue-grey"
                  v-if="props.row.estado"
                  @click="anularFactura( props.row )"
                  icon="close"
                  size="10px" />
              </q-td>
            </template>

            <template v-slot:no-data="{ icon, filter }">
              <div class="full-width row flex-center text-lime-10 q-gutter-sm">
                <q-icon size="2em" name="sentiment_dissatisfied" />
                <span class="text-subtitle1">
                  No se encontró ningun Resultado
                </span>
                <q-icon size="2em" :name="filter ? 'filter_b_and_w' : icon" />
              </div>
            </template>
          </q-table>
        </div>
      </div>
    </div>
  </q-page>

  <q-page-sticky position="bottom-right" :offset="[18, 18]"
      v-if="$q.screen.xs && validarPermisos('Agregar Compra')">
    <q-btn round color="secondary" size="lg"
        icon="add" @click=" $router.push('/ventas/add')" />
  </q-page-sticky>

  <q-dialog v-model="modalDetalleCompra">
    <DetalleCompra :compraData="compraData" />
  </q-dialog>

</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Api from "../../../apis/Api"
import { useRouter } from "vue-router";
import useRolPermisos from "../../../composables/useRolPermisos";
import useHelpers from "../../../composables/useHelpers";
import { useQuasar } from 'quasar'
import DetalleCompra from './DetalleCompra.vue'
import FiltrarCompras from './FiltrarCompras.vue'
import { useAuthUserStore } from "stores/auth-user"
import JWT from 'jwt-client'

const columns = [
  { name: 'acciones', label: 'acciones', align: 'center' },
  { name: 'punto_venta', label: 'Punto de Venta', align: 'center', field: 'pv_nombre' },
  { name: 'num_comprobante', label: 'Num Comprobante', field: 'num_comprobante' },
  { name: 'usuario', label: 'Usuario', align: 'center', field: 'usuario', headerStyle: 'width: 200px' },
  { name: 'proveedor', label: 'Proveedor', align: 'center', field: 'proveedor', headerStyle: 'width: 200px' },
  { name: 'fecha', label: 'Fecha/Hora', align: 'center', field: 'fecha', headerStyle: 'width: 100px' },
  { name: 'total', label: 'Total', field: 'total' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
]

export default defineComponent({
  name: 'IndexCompras',
  components: { DetalleCompra, FiltrarCompras },
  setup () {
    const rows = ref([]);
    const router = useRouter();
    const modalDetalleCompra = ref(false);

    const formFiltrarCompras = ref({ desde: '', hasta: '', pv_id: '' })

    const filter = ref('');
    const compraData = ref({})
    const { validarPermisos } = useRolPermisos();
    const { mostrarNotify } = useHelpers();
    const $q = useQuasar();
    const authUserStore = useAuthUserStore();
    const loading = ref( false )

    const { claim: { user } } = JWT.read(authUserStore.token);

    const getCompras = async () => {
      try {
        loading.value = true;

        let pv_busqueda = 0;
        if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
          pv_busqueda = authUserStore.pv_selected_admin
        else
          pv_busqueda = user.pv_id

        const { data } = await Api.post('/compras/consulta', { 
          pv_id: pv_busqueda, 
          filter: filter.value,
          desde: formFiltrarCompras.value.desde,
          hasta: formFiltrarCompras.value.hasta
        });

        data.compras.map( compra => {
          const dateArray = compra.fecha_compra.split('T')[0].split('-');
          const timeArray = compra.hora_compra.split(':');
          compra.fecha = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }  ${ timeArray[0] }:${ timeArray[1] } ${ (timeArray[0] < 12 ) ? 'am' : 'pm' }`
        })
        rows.value = data.compras;
        loading.value = false;
      } catch (error) {
        console.log(error)
        loading.value = false;
      }
    }

    const anularFactura = ( compra ) => {
      $q.dialog({
        title: '<center>¿Estas Seguro de anular esta compra?</center>',
        message: `<span><strong>Num Comprobante</strong>: ${ compra.num_comprobante }</span> <br>
                <span class='q-my-lg'><strong>Proveedor</strong>: ${ compra.proveedor }</span> <br>
                <span class='q-my-lg'><strong>Fecha/Hora</strong>: ${ compra.fecha }</span> <br>
                <span><strong>Total</strong>: $${ compra.total.toFixed(2) }</span> <br>`,
        html: true,
        ok: { push: true, label:'Anular', color: 'teal-7' },
        cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
      }).onOk(async () => {
        try {
          $q.loading.show({ message: 'Cargando...'})
          await Api.put(`/compras/${ compra.id }`);
          mostrarNotify('positive', 'Factura Anulada exitosamente');
          getCompras();
          $q.loading.hide()
        }catch (error){
          console.log(error);
        }
      })
    }

    const mostrarDetalleCompra = ( compra ) => {
      modalDetalleCompra.value = true;
      compraData.value = compra
    }

    const actualizarLista = ( data ) => {
      rows.value = data.compras;
      data.compras.map( compra => {

          const dateArray = compra.fecha_compra.split('T')[0].split('-');
          const timeArray = compra.hora_compra.split(':');
          compra.fecha = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }  ${ timeArray[0] }:${ timeArray[1] } ${ (timeArray[0] < 12 ) ? 'am' : 'pm' }`
      })
    }

    getCompras();

    watch(filter, (newValue, oldValue) => {
      getCompras();
    })

    return {
      actualizarLista,
      anularFactura,
      columns,
      mostrarDetalleCompra,
      modalDetalleCompra,
      loading,
      compraData,
      filter,
      formFiltrarCompras,
      rows,
      router,
      validarPermisos,
      user
    }
  }
})
</script>

<style>
.estadoVenta{
  font-size: 14px;
}
.totalVenta{
  font-size: 15px;
}
.table-ventas .q-table__top,
.table-ventas .q-table__bottom,
.table-ventas thead tr:first-child th {
  /* bg color is important for th; just specify one */
  background-color: #ddebdc; }

.table-ventas tbody tr:nth-child(even) {
  background-color: rgb(124, 27, 27);
  white-space: normal;
}
.table-ventas tbody tr:nth-child(even) {
  background-color: rgb(240, 240, 240);
  white-space: normal;
}
.table-ventas thead th, .table-ventas tbody td {
  white-space: normal;
}
</style>
