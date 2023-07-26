<template>
  <q-page>
    <div class="row q-py-lg q-pl-md">
      <FiltrarArticulos :pagination="pagination"
        :formFiltrarArticulo="formFiltrarArticulo"
        :user="user" @actualizarLista="actualizarLista" />

      <div class="col-md-2 flex justify-end">
        <q-btn color="secondary" icon-right="add_circle" class="q-mr-md"
        label="Nuevo" @click="modalAgregarArticulo = true"
        v-if="validarPermisos('Agregar Articulo') && !$q.screen.xs"/>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 col-xs-12">
        <div class="q-px-md q-pt-none">
          <q-table class="my-sticky-header-table"
            ref="tableRef" :rows="rows" :columns="columns"
            :filter="filter" row-key="id" v-model:pagination="pagination"
            :loading="loading" :rows-per-page-options="[3, 7, 15, 0]"
            binary-state-sort @request="onRequest">

            <template v-slot:top>
              <label>Filtrar por:</label>
              <q-option-group v-model="tipoBusqueda"
                inline style="margin-bottom: 0px"
                class="q-mb-md q-mr-md" :options="[
                  { label: 'CODIGO', value: 'codigo' },
                  { label: 'NOMBRE', value: 'nombre' },
                ]" />
               
              <q-space />
              <q-input dense debounce="1000" color="primary" v-model.trim="filter">
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </template>
            
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="acciones" :props="props">
                  <q-btn round color="blue-grey"
                    v-if="validarPermisos('Editar Articulo') && props.row.estado"
                    icon="edit" class="q-mr-sm"
                    @click="editarArticulo(props.row)" size="10px" />

                  <q-btn round color="blue-grey"
                  v-if="validarPermisos('Eliminar Articulo') && props.row.estado"
                  icon="close"
                  @click="eliminarArticulo(props.row.id)"
                  size="10px" />
                </q-td>
                <q-td key="pv_name" :props="props">{{ props.row.pv_nombre }}</q-td>
                <q-td key="cod_barra" :props="props">{{ props.row.cod_barra }}</q-td>
                <q-td key="producto" :props="props">{{ props.row.producto }}</q-td>
                <q-td key="prin_act" :props="props">{{ props.row.principio_activo }}</q-td>
                <q-td key="f/c" :props="props">{{ props.row.fxc }}</q-td>
                <q-td key="c_t" :props="props">{{ props.row.totalCajas }}</q-td>
                <q-td key="f_t" :props="props">{{ props.row.totalFracciones }}</q-td>
                <q-td key="f_c" :props="props">{{ props.row.fecha_caducidad }}</q-td>
                <q-td key="iva" :props="props">{{ props.row.aplicaIva }}</q-td>
                <q-td key="estado" :props="props">
                  <q-badge outline class="q-py-xs q-px-md"
                    :color="( props.row.estado ) ? 'positive' : 'dark'">
                     <span v-if="props.row.estado"> En Stock </span>
                     <span v-else>
                        Vendido
                        <br>
                        {{ props.row.fecha_venta }}
                      </span>
                  </q-badge>
                </q-td>
              </q-tr>
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

  <q-dialog v-model="modalAgregarArticulo" persistent>
    <AgregarArticulo @actualizarLista="getArticulos(0, pagination.rowsPerPage, null)" />
  </q-dialog>

  <q-dialog v-model="modalEditarArticulo">
    <EditarArticulo :articuloData="articuloData"
      @actualizarLista="getArticulos(0, pagination.rowsPerPage, null)" />
  </q-dialog>

  <q-page-sticky position="bottom-right" :offset="[18, 18]"
      v-if="$q.screen.xs && validarPermisos('Agregar Articulo')">
    <q-btn round color="secondary" size="lg"
        icon="add" @click="modalAgregarArticulo = true" />
  </q-page-sticky>


</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import { date, useQuasar, Loading } from 'quasar'
import { useRouter } from 'vue-router';
import JWT from 'jwt-client'
import { useAuthUserStore } from "stores/auth-user"
import Api from "../../../apis/Api"
import FiltrarArticulos from './FiltrarArticulos.vue'
import AgregarArticulo from './AgregarArticulo.vue'
import EditarArticulo from './EditarArticulo.vue'
import useRolPermisos from "../../../composables/useRolPermisos";

const columns = [
  { name: 'acciones', label: 'acciones', align: 'center' },
  { name: 'pv_name', label: 'Punto de Venta', align: 'center', field: 'pv_name' },
  { name: 'cod_barra', label: 'Codigo de Barra', align: 'center', field: 'cod_barra' },
  { name: 'producto', label: 'Producto', align: 'center', field: 'producto' },
  { name: 'prin_act', label: 'Principio Activo', align: 'center', field: 'principio_activo' },
  { name: 'f/c', label: 'Fraccion * Caja', align: 'center', field: 'fxc', style: 'width: 100px' },
  { name: 'c_t', label: 'Total cajas', align: 'center', field: 'c_t', style: 'width: 100px' },
  { name: 'f_t', label: 'Fracciones Total', align: 'center', field: 'f_t', style: 'width: 100px' },
  { name: 'f_c', label: 'Fecha de Caducidad', align: 'center', field: 'fecha_caducidad' },
  { name: 'iva', label: 'Aplica Iva', align: 'center', field: 'iva' },
  { name: 'estado', label: 'Estado', align: 'center' }
]

export default defineComponent({
  name: 'IndexArticulo',
  components: { AgregarArticulo, EditarArticulo, FiltrarArticulos },
  setup () {
    const { validarPermisos } = useRolPermisos();
    const authUserStore = useAuthUserStore();
    const { claim: { user } } = JWT.read(authUserStore.token);
    const articuloData = ref(null);
    const formFiltrarArticulo = ref({
      page: '',
      rowsPerPage: '',
      pv_id: 0,
      tipoBusqueda: 'codigo',
      busqueda: ''
    })

    const modalFiltrarArticulo = ref( false );
    const modalAgregarArticulo = ref( false );
    const modalEditarArticulo  = ref( false );

    const router = useRouter();
    const $q = useQuasar();

    const originalRows = ref([]);
    const rows = ref([]);
    const tipoBusqueda = ref('codigo');
    const filter = ref('');
    const pv_id = ref('');
    const tableRef = ref();
    const loading = ref(false);
    const pagination = ref({
      sortBy: 'desc',
      descending: false,
      page: 1,
      rowsPerPage: 7,
      rowsNumber: 10
    })

    const actualizarLista = ( filas = null ) => {
      getArticulos( 0, pagination.value.rowsPerPage, filas );
    }

    const eliminarArticulo = async ( articulo_id ) => {
      try {
        $q.dialog({
          title: 'Deseas Eliminar este articulo?',
          message: 'Una vez eliminado no podra recuperarse...!',
          ok: { push: true, label:'Eliminar', color: 'teal-7' },
          cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
        }).onOk(async () => {
          Loading.show({message: 'Cargando...'});
          await Api.delete(`/articulos/${ articulo_id }`)
          getArticulos(0, pagination.value.rowsPerPage, null);
          $q.notify({
            color: 'positive',
            message: 'Articulo Eliminado Exitosamente',
            icon: 'done',
            position: 'top-right'
          })
          Loading.hide();
        })

      } catch (error) {
        Loading.hide();
        $q.notify({
            color: 'warning',
            message: error.response.data.message,
            icon: 'error',
            position: 'top-right'
        })
      }
    }

    const editarArticulo = async ( articulo ) => {
      articuloData.value = articulo;
      modalEditarArticulo.value = true;
    }

    const getArticulos = async (page, rowsPerPage, filtro = null) => {
        modalAgregarArticulo.value = false;
        modalEditarArticulo.value = false;
        let busqueda = 0;
        var articulos = [];

        if (filter.value == '') busqueda = 'sin-busqueda';
        else busqueda = filter.value

        if ( user.rol_name != 'ADMINISTRADOR' && user.rol_name != 'SUPER-ADMINISTRADOR' )
          pv_id.value = user.pv_id

        try {
          if ( filtro == null ){
            const { data } = await Api.post(`/articulos/contarArticulos`, {
              page,
              rowsPerPage,
              tipoBusqueda: formFiltrarArticulo.value.tipoBusqueda,
              busqueda,
              pv_id: formFiltrarArticulo.value.pv_id
            });
            articulos = data.articulos

            if (data.articulos.length != 0) pagination.value.rowsNumber = data.articulos[0].totalArticulos;
            else pagination.value.rowsNumber = 0
          }
          else{
            articulos = filtro.articulos;

            if(filtro.articulos.length == 0)
              pagination.value.rowsNumber = 0;
            else
              pagination.value.rowsNumber = filtro.articulos[0].totalArticulos;
          }

          articulos.map( articulo => {
            const stock = articulo.fracciones_total;
            const fxc =  articulo.fxc;
                        
            articulo.totalCajas = ( stock !== 0 ) ? parseInt(stock / fxc) : 0
            articulo.totalFracciones = ( stock !== 0 ) ? parseInt(stock % fxc): 0

            let dateArray = articulo.fecha_caducidad.split('T')[0].split('-');
            articulo.fecha_caducidad = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }`
          })

          rows.value = articulos;
        } catch (error) {
          console.log(error)
        }
    }

    async function onRequest (props) {
      formFiltrarArticulo.value.busqueda = filter.value

      const { page, rowsPerPage, sortBy, descending } = props.pagination

      loading.value = true

      const startRow = (page - 1) * rowsPerPage
      await getArticulos(startRow, rowsPerPage);

      // update rowsCount with appropriate value
      if (rows.value.length != 0) pagination.value.rowsNumber = rows.value[0].totalArticulos;
      else pagination.value.rowsNumber = 0

      pagination.value.page = page
      pagination.value.rowsPerPage = rowsPerPage
      pagination.value.sortBy = sortBy
      pagination.value.descending = descending

      loading.value = false
    }

    onMounted(() => {
      // get initial data from server (1st page)
      tableRef.value.requestServerInteraction()
    })

    watch(tipoBusqueda, (currentValue, oldValue) => {
      formFiltrarArticulo.value.tipoBusqueda = currentValue;

      getArticulos(0, pagination.value.rowsPerPage, null);
    });

    return {
      articuloData,
      actualizarLista,
      columns,
      date,
      editarArticulo,
      eliminarArticulo,
      getArticulos,
      filter,
      formFiltrarArticulo,
      modalAgregarArticulo,
      modalEditarArticulo,
      modalFiltrarArticulo,
      loading,
      originalRows,
      router,
      rows,
      tableRef,
      tipoBusqueda,
      onRequest,
      pagination,
      validarPermisos,
      user
    }
  }
})
</script>

<style>
.my-sticky-header-table .q-table__top,
.my-sticky-header-table .q-table__bottom,
.my-sticky-header-table thead tr:first-child th {
  /* bg color is important for th; just specify one */
  background-color: #ddebdc; }

.my-sticky-header-table tbody tr:nth-child(even) {
    background-color: rgb(240, 240, 240);
}
</style>
