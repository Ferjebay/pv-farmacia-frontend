<template>
    <q-page>
      <div class="row q-py-lg q-pl-md" :class="$q.screen.xs ? 'justify-center' : 'justify-between'">
        <div class="col-md-6">
          <label class="text-h6">Listado de Productos Caducados</label>
        </div>
      </div>
  
      <div class="row">
        <div class="col-md-12 col-xs-12">
          <div class="q-pa-md">
            <q-table
              class="my-sticky-header-table"
              :rows="rows"
              :columns="columns"
              :filter="filter"
              :loading="loading"
              row-key="name">
  
              <template v-slot:top>
                <q-space />
                <q-input dense debounce="300" color="primary" v-model="filter">
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
  
              <template v-slot:body-cell-id="props">
                <q-td :props="props">
                  {{ props.pageIndex + 1 }}
                </q-td>
              </template>
  
              <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                  <template v-if="props.row.diasPorCaducar < 0">
                    <q-badge outline color="red" label="Vencido" class="q-pa-sm" />
                  </template>
                  <template v-else-if="props.row.diasPorCaducar == 0">
                    <q-badge outline color="orange-6" label="Vence Hoy" class="q-pa-sm" />
                  </template>
                  <template v-else-if="props.row.diasPorCaducar < 30 && props.row.diasPorCaducar > 0">
                    <q-badge outline color="orange-6" label="Por caducar" class="q-pa-sm" />
                  </template>
                  <template v-else-if="props.row.diasPorCaducar > 30">
                    <q-badge outline color="positive" label="Proximo a vencer" class="q-pa-sm" />
                  </template>
                </q-td>
              </template>
  
              <template v-slot:body-cell-acciones="props">
                <q-td :props="props">
                    <q-btn @click="updateDateProduct( props.row )"
                        round color="grey-14" icon="update" size="11px" />
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

    <q-dialog v-model="modalUpdateDate">
        <q-card style="width: 560px; max-width: 80vw;">
        <q-card-section class="row items-center q-pb-none text-center">
        <div class="text-h6 text-center">Actualizar Fecha de Caducidad</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
        <q-form>
            <div class="col-xs-10 col-sm-3">
                <div class="offset-1 col-xs-10 col-sm-4 q-mb-lg">
                    <label>Producto:</label>
                    <q-input v-model.trim="productUpdate.producto_update" 
                        dense filled required readonly />
                </div>

                <label>Fecha de Caducidad:</label>
                <q-input filled v-model="productUpdate.fecha_caducidad_update" 
                    dense mask="date" clearable clear-icon="close">
                    <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="productUpdate.fecha_caducidad_update" :locale="myLocale">
                                <div class="row items-center justify-end">
                                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                                </div>
                            </q-date>
                        </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-xs-9 col-sm-12  flex justify-center q-mt-lg">
                <q-btn @click="submit" :loading="loadingUpdate"
                label="Actualizar" class="q-px-xl" color="green-9"/>
            </div>
        </q-form>
        </q-card-section>
    </q-card>
    </q-dialog>
  
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue'
  import { Dialog, date } from 'quasar'
  import Api from "../../../apis/Api"
  import useRolPermisos from "../../../composables/useRolPermisos";
  import useHelpers from "../../../composables/useHelpers";
  const columns = [
    { name: 'id', label: '#', align: 'left', field: 'id', sortable: true },
    { name: 'cod_barra', align: 'center', label: 'Codigo de Barra', field: 'cod_barra' },  
    { name: 'nombre', align: 'center', label: 'Nombre', field: 'producto' },  
    { name: 'fecha_cad', align: 'center', label: 'F. Vencimiento', field: 'fecha_caducidad' },  
    { name: 'tiempo_cad', align: 'center', label: 'Dias por Caducar', field: 'diasPorCaducar' },  
    { name: 'cajas', label: 'Stock Cajas', align: 'center', field: 'totalCajas' },
    { name: 'fracciones', label: 'Stock Fracciones', align: 'center', field: 'totalFracciones' },
    { name: 'estado', label: 'Estado', align: 'center', field: 'estado' },
    { name: 'acciones', label: 'acciones', align: 'center' }
  ]
  
  export default defineComponent({
    name: 'productosACaducar',
    setup () {
      const { validarPermisos } = useRolPermisos();
      const filter = ref('')
      const rows = ref([]);
      const loading = ref( false );
      const loadingUpdate = ref( false );
      const modalUpdateDate = ref( false );
      const categoriaData = ref({});

      const productUpdate = ref({
        id: '',
        fecha_caducidad_update: '',
        producto_update: ''
      })


      const { mostrarNotify } = useHelpers();
  
      const getProductosByCaducar = async () => {
        loading.value = true;
        try {
            const { data: { articulos } } = await Api.get('/articulos/productosByExpirar');

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
        loading.value = false;
      }

      const updateDateProduct = ({ id, producto, fecha_caducidad }) => {
        modalUpdateDate.value = true;
        productUpdate.value.producto_update = producto;
        productUpdate.value.id = id;
        
        const arrayDate = fecha_caducidad.split('/')
        productUpdate.value.fecha_caducidad_update = `${ arrayDate[2] }/${ arrayDate[1] }/${ arrayDate[0] }`;
      }

      const submit = async() => {
        try {
            loadingUpdate.value = true;

            await Api.put(`/articulos/updateDate/${ productUpdate.value.id }`, productUpdate.value)
            mostrarNotify('positive', 'Fecha de caducidad actualizado Exitosamente');
            modalUpdateDate.value = false;
            getProductosByCaducar();

            loadingUpdate.value = false;
        } catch (error) {
            console.log(error);
            loadingUpdate.value = false;
        }
      }
  
      getProductosByCaducar();
  
      return {
        columns,
        filter,
        getProductosByCaducar,
        modalUpdateDate,
        loading,
        loadingUpdate,
        categoriaData,
        productUpdate,
        rows,
        validarPermisos,
        myLocale: {
            /* starting with Sunday */
            days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
            daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
            months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
            monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
            firstDayOfWeek: 1, // 0-6, 0 - Sunday, 1 Monday, ...
            format24h: true,
            pluralDay: 'dias'
        }, 
        updateDateProduct,
        submit
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
  