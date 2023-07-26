<template>
  <q-page>
    <div class="row q-my-lg q-pl-md">

      <div class="col-md-5 q-mt-lg">
        <label>Seleccionar Proveedor: 
        </label>
        <q-select color="orange" filled v-model="formCompras.proveedor_id" dense
          :options="listProveedores" emit-value map-options
          @filter="filterFn" use-input input-debounce="0">
          
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No hay resultados
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      
      <div class="col-md-1 q-mt-lg btnAddCliente">
        <q-btn round color="primary" @click="modalAgregarProveedor = true" icon="person_add" />
      </div>

      <div class="col-md-4 q-mt-lg">
        <label>Numero de Comprobante: 
        </label>
        <q-input v-model="formCompras.numComprobante" dense filled required />
      </div>
    </div>

    <div class="row q-my-lg q-pl-md">
      <div class="col-md-5">
        <label>Filtrar por codigo de barra o nombre del producto:</label>
        <q-input outlined bottom-slots :loading="loadingState"
          v-model.trim="filterByCodBarra" @keyup.enter="filterArticulo">
          <template v-slot:append>
            <q-icon v-if="filterByCodBarra !== ''" name="close" @click="filterByCodBarra = ''"
            class="cursor-pointer" />
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-md-1 q-mt-lg btnAddCliente"></div>

      <div class="col-md-4 q-mt-sm">
        <label>Descripción: </label>
        <q-input v-model="formCompras.descripcion" dense filled required />
      </div>
    </div>

    <q-form @submit="onSubmit">
      <div class="row" >
        <div class="col-md-12">
          <div class="q-pa-md">

            <q-table :rows="rows" :columns="columns" row-key="name" 
              v-model:pagination="pagination" class="my-sticky-header-table3">

              <template v-slot:no-data="{  }">
                <div class="full-width row flex-center text-lime-10 q-gutter-sm">
                  <span class="text-subtitle1">
                    Agrega algún Producto
                  </span>
                  <q-icon size="2em" name="playlist_add" />
                </div>
              </template>

              <template v-slot:body-cell-cantidad="props">
                <q-td :props="props">
                   <q-input input-class="resaltarTextoInput" dense required 
                    @change="calcularCostoVentaProducto( props.row )" min="0"
                    type="number" style="width: 100px;" v-model.trim="props.row.cant_venta" />
                </q-td>
              </template>

              <template v-slot:body-cell-f_c="props">
                <q-td :props="props">
                   <q-input input-class="resaltarTextoInput" dense required min="0"
                    @change="calcularCostoVentaProducto( props.row )" :disable="props.row.fxc == 1"
                    type="number" style="width: 100px;" v-model.trim="props.row.f_c" />
                </q-td>
              </template>

              <template v-slot:body-cell-pvm="props">
                <q-td :props="props">
                  ${{ props.row.pvm.toFixed(2) }}
                </q-td>
              </template>

              <template v-slot:body-cell-acciones="props">
                <q-td :props="props">
                  <q-btn round color="deep-orange"
                  @click="quitarArticulo(props.row.id)"
                  icon="close" size="8px" />
                </q-td>
              </template>

            </q-table>
          </div>
        </div>
        <div class="col-md-12" style="display: flex;justify-content: end;">
          <table style="margin-right: 30px;">
            <tr class="text-right">
              <td><b>SUBTOTAL:</b></td>
              <td style="width: 90px;" class="text-subtitle1 text-weight-regular">
                ${{ valorFactura.subtotal }}
              </td>
            </tr>
            <tr class="text-right">
              <td><b>TOTAL DE COMPRA:</b></td>
              <td style="width: 90px;">
                <q-badge outline class="text-subtitle1 text-weight-bold"
                    color="secondary" :label="`$${ valorFactura.total }`" />
              </td>
            </tr>
          </table>
        </div>
        <div class="col-md-4 offset-4">
          <q-btn square color="green-10" type="submit" label="Agregar Compra"
            class="full-width" icon="shopping_cart" />
        </div>
      </div>
    </q-form>
  </q-page>

  <!-- AGREGAR UN NUEVO PROVEEDOR -->
  <q-dialog v-model="modalAgregarProveedor">
    <Add @actualizarLista="getProveedores" />
  </q-dialog>

  <!-- BUSCAR ALGUN PRODUCTO -->
  <q-dialog v-model="modalBuscarProducto">
    <Search :productos="productos" @addArticle="addArticle" />
  </q-dialog>

</template>

<script>
import { computed, defineComponent, ref } from 'vue'
import Api from "../../../apis/Api"
import { useRouter } from "vue-router";
import JWT from 'jwt-client'
import { useAuthUserStore } from "stores/auth-user"
import useHelpers from "../../../composables/useHelpers";
import { useQuasar } from 'quasar'
import Add from '../proveedores/Add.vue'
import Search from './BuscarProducto.vue'

const columns = [
  { name: 'acciones', label: 'Quitar', align: 'left'  },
  { name: 'cod_barra', label: 'Codigo Barra', align: 'left', field: 'cod_barra' },
  { name: 'producto', label: 'Producto', align: 'left', field: 'producto' },
  { name: 'cantidad', label: 'Cajas', align: 'center', field: 'cantidad' },
  { name: 'f_c', label: 'F/C', align: 'center', field: 'f_c' },
  { name: 'fxc', label: 'F. por caja', align: 'center', field: 'fxc' },
  { name: 'cajas', label: 'T. cajas', align: 'center', field: 'cajas' },
  { name: 'fracciones', label: 'T. fracciones', align: 'center', field: 'fracciones' },
  { name: 'pvm', label: 'Costo Neto', align: 'center', field: 'pvm' },
  { name: 'v_total', label: 'Valor Total', align: 'center', field: 'v_total' },
]
let optionsProveedores = []

export default defineComponent({
  name: 'AddCompra',
  components: { Add, Search },
  setup () {
    const rows = ref([]);
    const listProveedores = ref([]);
    const modalAgregarProveedor = ref(false);
    const modalBuscarProducto = ref(false);
    const productos = ref([]);
    const loadingState = ref(false)
    const { mostrarNotify } = useHelpers();
    const $q = useQuasar();
    const formCompras = ref({
      proveedor_id: '',
      numComprobante: '',
      descripcion: ''
    });
    const pagination = ref({
      sortBy: 'desc',
      descending: false,
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 25
    })
    const filterByCodBarra = ref('');

    const router = useRouter();
    const authUserStore = useAuthUserStore();

    const { claim: { user } } = JWT.read(authUserStore.token);

    const agregarAndValidarStock = ( data ) => {
        //VERIFICAR SI YA SE AGREGO ESTE ARTICULO
        const resultado = rows.value.some( row => row.cod_barra == data.cod_barra )
        if ( !resultado ){
          const stock = data.fracciones_total;
          const fxc =  data.fxc;

          data.cajas = ( stock !== 0 ) ? parseInt(stock / fxc) : 0
          data.fracciones = ( stock !== 0 ) ? parseInt(stock % fxc): 0
          data.pvp = data.pvp.toFixed(2)
          data.p_unit = data.p_unit.toFixed(2)
          data.cant_venta = 0;
          data.f_c = 0;
          data.v_total = (0).toFixed(2);

          rows.value.unshift( data );
          filterByCodBarra.value = ''
        }
        else
          mostrarNotify('warning', 'Ya fue agregado este articulo');
    }

    const filterArticulo = async () => {
      if( filterByCodBarra.value.length == 0 ) return mostrarNotify('warning', 'Ingresa el codigo IMEI');

      try {
        loadingState.value = true

        let pv_busqueda = 0;
        if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
          pv_busqueda = authUserStore.pv_selected_admin
        else
          pv_busqueda = user.pv_id

        const { data } = await Api.get(`/articulos/${ filterByCodBarra.value }/${ pv_busqueda }`);

        if ( data.articulo.length > 1 ) {
          productos.value = data.articulo;
          modalBuscarProducto.value = true;
          return loadingState.value = false
        }

        //Verificar si se encontro el articulo
        if ( data.articulo.length == 0 ) {
          loadingState.value = false
          return mostrarNotify('warning', 'No se encontro el articulo...');
        }

        agregarAndValidarStock( data.articulo[0] )

        loadingState.value = false
      } catch (error) {
        console.log(error)
        loadingState.value = false
      }
    }

    const addArticle = ( data ) => {
      agregarAndValidarStock( data )
      modalBuscarProducto.value = false
    }

    const calcularCostoVentaProducto = ( row ) => {
      let fraccionesAComprar = (row.fxc * row.cant_venta) + parseInt(row.f_c)
      let valorPorUnidad = row.pvm / row.fxc;
      row.v_total = (fraccionesAComprar * valorPorUnidad).toFixed(2)
    }

    const quitarArticulo = ( articulo_id ) => {
      const indice = rows.value.findIndex( row => row.id == articulo_id )
      rows.value.splice(indice, 1);
    }

    const getProveedores = async () => {
      //Cerrar modal de agregar cliente
      modalAgregarProveedor.value = false;
      try {
        const { data: { proveedores } } = await Api.get('/proveedores/true');

        listProveedores.value = [];

        proveedores.forEach(proveedor => {
            listProveedores.value.push({
              label: proveedor.razon_social,
              value: proveedor.id,
              cedula: proveedor.numero_documento
            })
        });

        optionsProveedores = listProveedores.value;
      } catch (error) {
        console.log(error)
      }
    }

    const valorFactura = computed(() => {
      let subtotal = 0, iva = 0, descuento = 0, total = 0;
      rows.value.forEach( row => {
        
        subtotal += parseFloat(row.v_total)
      })

      total = ( subtotal + iva ) - descuento

      return {
        subtotal: subtotal.toFixed(2),
        iva: iva.toFixed(2),
        descuento: descuento.toFixed(2),
        total: total.toFixed(2),
      }
    })

    const onSubmit = async () => {
      if ( formCompras.value.proveedor_id == '' ) 
        return mostrarNotify('warning', 'Debes elegir algun proveedor')
      if ( formCompras.value.numComprobante == '' ) 
        return mostrarNotify('warning', 'Por favor ingresa el numero de comprobante')
      if ( formCompras.value.descripcion == '' ) 
        return mostrarNotify('warning', 'Por favor ingresa una descripción')

      if (rows.value.length == 0) return mostrarNotify('warning', 'Debes agregar algun producto..');

      let pv_busqueda = 0;
      if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
        pv_busqueda = authUserStore.pv_selected_admin
      else
        pv_busqueda = user.pv_id

      formCompras.value.usuario_id = user.id
      formCompras.value.usuario_name = `${ user.nombres.split(' ')[0] } ${ user.apellidos }`
      formCompras.value.pv_id = pv_busqueda
      formCompras.value.detalle = rows.value
      formCompras.value.valoresFactura = valorFactura.value

      try {
        $q.dialog({
          title: '¿Deseas Agregar esta Compra?',
          ok: { push: true, label: 'Agregar' },
          cancel: { push: true, color: 'blue-grey-6', label: 'Cancelar' }
        }).onOk(async () => {
          $q.loading.show({message: 'Cargando...'});

          await Api.post('/compras/add', formCompras.value)

          $q.loading.hide();

          mostrarNotify('positive', 'Compra realizada exitosamente');

          router.push('/compras');
        })
      } catch (error) {
        console.log(error);
        $q.loading.hide();
      }
    }

    getProveedores();

    return {
      addArticle,
      calcularCostoVentaProducto,
      columns,
      formCompras,
      filterByCodBarra,
      filterArticulo,
      listProveedores,
      loadingState,
      getProveedores,
      modalAgregarProveedor,
      modalBuscarProducto,
      pagination,
      productos,
      rows,
      valorFactura,
      router,
      filterFn (val, update) {
        if (val === '') {
          update(() => { listProveedores.value = optionsProveedores })
          return
        }
        update(() => {
          const needle = val.toLowerCase()
          listProveedores.value = listProveedores.value.filter(v =>
            v.cedula.indexOf(needle) > -1 || v.label.toLowerCase().indexOf(needle) > -1          
          )
        })
      },
      onSubmit,
      quitarArticulo
    }
  }
})
</script>

<style>
#labelNV{
  font-size: 25px;
  font-weight: 500;
  margin-left: 10px;
}
.btnAddCliente{
  margin-top: 48px;
  margin-left: 20px;
}
.resaltarTextoInput{
  font-size: 17px;
  text-align: center;
  color: #313131;
  font-weight: 500;
}
.my-sticky-header-table3 .q-table__top,
.my-sticky-header-table3 thead tr:first-child th {
  /* bg color is important for th; just specify one */
  background-color: #3d403d;
  color: rgb(245, 241, 241);
}
.my-sticky-header-table3 tbody tr:nth-child(even) {
    background-color: rgb(243, 235, 245);
}
</style>
