<template>
  <q-page>
    <div class="row q-py-lg q-pl-md">

      <FiltrarVentas @actualizarLista = "actualizarLista" 
        :user="user" :formFiltrarVentas="formFiltrarVentas" />

      <div class="col-md-3 col-sm-3 flex justify-end">
        <q-btn v-if="validarPermisos('Agregar Venta') && !$q.screen.xs"
          color="secondary" label="nueva Venta" class="q-mr-md"
          @click=" $router.push('/ventas/add')" />
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
              <label class="q-mr-xl text-h5 text-weight-regular">Listado de Ventas <q-icon  name="fa fa fa-cash-register" size="30px" color="secondary"  /></label>
                <label class="q-ml-xl q-pl-xl text-subtitle1">
                  <b>TOTAL DE VENTAS:</b>
                  <q-badge outline class="q-px-md text-subtitle1 q-ml-sm text-weight-bold"
                    color="blue-grey" :label=" `$${ totalVentas.toFixed(2) }` " />
                </label>

                <q-space />
                <q-input dense debounce="1000" color="primary" v-model="filter">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
            </template>

            <template v-slot:body-cell-total="props">
              <q-td :props="props" class="totalVenta text-weight-regular">
                ${{  props.row.total.toFixed(2)  }}
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
                  @click="mostrarDetalleFactura( props.row )"
                  class="q-mr-sm"
                  size="10px" />
                  
                <q-btn round color="blue-grey"
                  icon="print" :loading="loadingImpresion"
                  @click="imprimirFactura( props.row )"
                  class="q-mr-sm"
                  size="10px" />

                <q-btn round color="blue-grey"
                  v-if="props.row.estado"
                  icon="close"
                  @click="anularFactura( props.row )"
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
      v-if="$q.screen.xs && validarPermisos('Agregar Venta')">
    <q-btn round color="secondary" size="lg"
        icon="add" @click=" $router.push('/ventas/add')" />
  </q-page-sticky>

  <q-dialog v-model="modalDetalleFactura">
    <DetalleFactura :facturaData="facturaData" />
  </q-dialog>

</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Api from "../../../apis/Api"
import { useRouter } from "vue-router";
import useRolPermisos from "../../../composables/useRolPermisos";
import useHelpers from "../../../composables/useHelpers";
import { useQuasar } from 'quasar'
import DetalleFactura from './DetalleFactura.vue'
import FiltrarVentas from './FiltrarVentas.vue'
import { useAuthUserStore } from "stores/auth-user"
import JWT from 'jwt-client'

const columns = [
  { name: 'acciones', label: 'acciones', align: 'center' },
  { name: 'punto_venta', label: 'Punto de Venta', align: 'center', field: 'pv_nombre' },
  { name: 'num_comprobante', label: 'Num Comprobante', field: 'num_comprobante' },
  { name: 'usuario', label: 'Usuario', align: 'center', field: 'usuario', headerStyle: 'width: 200px' },
  { name: 'cliente', label: 'Cliente', align: 'center', field: 'cliente', headerStyle: 'width: 200px' },
  { name: 'fecha', label: 'Fecha/Hora', align: 'center', field: 'fecha', headerStyle: 'width: 100px' },
  { name: 'total', label: 'Total', field: 'totalPago' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
]

export default defineComponent({
  name: 'IndexVentas',
  components: { DetalleFactura, FiltrarVentas },
  setup () {
    const rows = ref([]);
    const router = useRouter();
    const modalDetalleFactura = ref(false);

    const formFiltrarVentas = ref({ desde: '', hasta: '', pv_id: '' })

    const totalVentas = ref( 0 );

    const filter = ref('');
    const facturaData = ref({})
    const { validarPermisos } = useRolPermisos();
    const { mostrarNotify } = useHelpers();
    const $q = useQuasar();
    const authUserStore = useAuthUserStore();
    const loading = ref( false )
    const loadingImpresion = ref( false )

    const { claim: { user } } = JWT.read(authUserStore.token);

    const getVentas = async () => {
      try {
        loading.value = true;

        let pv_busqueda = 0;
        if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
          pv_busqueda = authUserStore.pv_selected_admin
        else
          pv_busqueda = user.pv_id

        const { data } = await Api.post('/ventas/consulta', { 
          pv_id: pv_busqueda, 
          filter: filter.value,
          desde: formFiltrarVentas.value.desde,
          hasta: formFiltrarVentas.value.hasta
        });
        totalVentas.value = 0;

        data.facturas.map( factura => {
          if (factura.estado) totalVentas.value += factura.total

          const dateArray = factura.fecha_emision.split('T')[0].split('-');
          const timeArray = factura.hora_emision.split(':');
          factura.fecha = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }  ${ timeArray[0] }:${ timeArray[1] } ${ (timeArray[0] < 12 ) ? 'am' : 'pm' }`
        })
        rows.value = data.facturas;
        loading.value = false;
      } catch (error) {
        console.log(error)
        loading.value = false;
      }
    }

    const anularFactura = ( factura ) => {
      $q.dialog({
        title: '<center>¿Estas Seguro de anular esta Factura?</center>',
        message: `<span><strong>Num Comprobante</strong>: ${ factura.num_comprobante }</span> <br>
                <span class='q-my-lg'><strong>Cliente</strong>: ${ factura.cliente }</span> <br>
                <span class='q-my-lg'><strong>Fecha/Hora</strong>: ${ factura.fecha }</span> <br>
                <span><strong>Total</strong>: $${ factura.total.toFixed(2) }</span> <br>`,
        html: true,
        ok: { push: true, label:'Anular', color: 'teal-7' },
        cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
      }).onOk(async () => {
        try {
          $q.loading.show({ message: 'Cargando...'})
          await Api.put(`/ventas/${ factura.id }`);
          mostrarNotify('positive', 'Factura Anulada exitosamente');
          getVentas();
          $q.loading.hide()
        }catch (error){
          console.log(error);
        }
      })
    }

    const mostrarDetalleFactura = ( factura ) => {
      modalDetalleFactura.value = true;
      facturaData.value = factura
    }

    const imprimirFactura = async ( factura ) => {
      try {
        loadingImpresion.value = true;

        await Api.post('/ventas/imprimirFactura', factura);

        loadingImpresion.value = false;
      } catch (error) {
        console.log(error)
      }
    }

    const actualizarLista = ( data ) => {
      totalVentas.value = 0;
      rows.value = data.facturas;
      data.facturas.map( factura => {
          if (factura.estado) totalVentas.value += factura.total

          const dateArray = factura.fecha_emision.split('T')[0].split('-');
          const timeArray = factura.hora_emision.split(':');
          factura.fecha = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }  ${ timeArray[0] }:${ timeArray[1] } ${ (timeArray[0] < 12 ) ? 'am' : 'pm' }`
      })
    }

    getVentas();

    watch(filter, (newValue, oldValue) => {
      getVentas();
    })

    return {
      actualizarLista,
      anularFactura,
      columns,
      mostrarDetalleFactura,
      modalDetalleFactura,
      loading,
      loadingImpresion,
      facturaData,
      filter,
      formFiltrarVentas,
      rows,
      router,
      totalVentas,
      validarPermisos,
      imprimirFactura,
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
