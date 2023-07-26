<template>
  <q-page>
    <div class="row q-my-lg q-pl-md">
      <div class="col-md-6">
        <label class="text-h5 text-weight-medium">Fecha de Emisión:
          <span class="text-weight-regular">{{ fechaActual }}</span>
        </label>
      </div>
      <div class="col-md-6 text-right">
        <label class="q-mr-lg text-h5 text-weight-medium">
          <span class="q-mr-sm">N° Factura:</span>
          <q-spinner-facebook v-if="numFacturaCargado"
            color="primary" class="q-ml-md" size="2em" />
          <span v-else class="text-weight-regular">
            {{ formVenta.numComprobante }}
          </span>
        </label>
      </div>

      <div class="col-md-5 q-mt-md">
        <label>Seleccionar Cliente: 
          <!-- <q-badge outline class="q-mb-lg" color="orange" label="Factura que superen los 50 USD no puede ser emitida a nombre del CONSUMIDOR FINAL" /> -->
        </label>
        <q-select color="orange" filled v-model="formVenta.cliente_id"
          :options="listClientes" emit-value map-options
          @filter="filterFn" use-input input-debounce="0">
          <template v-if="formVenta.cliente_id && formVenta.cliente_id !== 'CONSUMIDOR FINAL'" v-slot:append>
            <q-icon name="cancel"
              @click.stop.prevent="formVenta.cliente_id = 'CONSUMIDOR FINAL'" class="cursor-pointer" />
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No hay resultados
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <div class="col-md-4 q-mt-lg btnAddCliente">
        <q-btn round color="primary"
          @click="modalAgregarCliente = true"
          icon="person_add" />
      </div>
    </div>

    <div class="row q-mt-lg q-mb-xs q-pl-md">
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
    </div>

    <q-form @submit="onSubmit">
      <div class="row" >
        <div class="col-md-12">
          <div class="q-px-md">

            <q-table :rows="rows" :columns="columns" v-model:pagination="pagination"
              row-key="name" class="my-sticky-header-table3">

              <template v-slot:no-data="{  }">
                <div class="full-width row flex-center text-lime-10 q-gutter-sm">
                  <span class="text-subtitle1">
                    Agrega algún Producto
                  </span>
                  <q-icon size="2em" name="playlist_add" />
                </div>
              </template>

              <template v-slot:body-cell-descuento="props">
                <q-td :props="props">
                  {{ props.row.descuento }}%
                </q-td>
              </template>

              <template v-slot:body-cell-cantidad="props">
                <q-td :props="props">
                   <q-input input-class="resaltarTextoInput" dense required :max="props.row.cajas"
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
        <div class="col-md-12" style="display: flex; justify-content: space-between;">

          <div>
            <q-checkbox v-model="imprimir" label="IMPRIMIR FACTURA" 
              color="primary" size="lg" class="q-ml-lg q-mt-lg" />
          </div>

          <table style="margin-right: 30px;">
            <tr class="text-right">
              <td><b>SUBTOTAL:</b></td>
              <td style="width: 90px;" class="text-subtitle1 text-weight-regular">
                ${{ valorFactura.subtotal }}
              </td>
            </tr>
            <tr class="text-right">
              <td class="q-py-sm"><b>IVA(12%):</b></td>
              <td style="width: 90px;" class="q-py-sm text-subtitle1 text-weight-regular">
                ${{ valorFactura.iva }}
              </td>
            </tr>
            <tr class="text-right">
              <td class="q-py-sm"><b>TOTAL DESCUENTO:</b></td>
              <td style="width: 90px;" class="q-py-sm text-subtitle1 text-weight-regular">
                ${{ valorFactura.descuento }}
              </td>
            </tr>
            <tr class="text-right">
              <td><b>TOTAL A PAGAR:</b></td>
              <td style="width: 90px;">
                <q-badge outline class="text-subtitle1 text-weight-bold"
                    color="secondary" :label="`$${ valorFactura.total }`" />
              </td>
            </tr>
          </table>
        </div>
        <div class="col-md-4 offset-4">
          <q-btn square color="green-10" type="submit" label="Agregar Venta"
            class="full-width" icon="shopping_cart" />
        </div>
      </div>
    </q-form>
  </q-page>

  <!-- AGREGAR UN NUEVO CLIENTE -->
  <q-dialog v-model="modalAgregarCliente">
    <Add @actualizarLista="getClientes" />
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
import { date, useQuasar } from 'quasar'
import Add from '../clientes/Add.vue'
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
  { name: 'pvp', label: 'Precio Venta', align: 'center', field: 'pvp' },
  { name: 'p_unit', label: 'Precio Unitario', align: 'center', field: 'p_unit' },
  { name: 'descuento', label: 'Descuento', align: 'center', field: 'descuento' },
  { name: 'iva', label: 'IVA', align: 'center', field: 'aplicaIva' },
  { name: 'v_total', label: 'Valor Total', align: 'center', field: 'v_total' },
]
let optionsClients = []

export default defineComponent({
  name: 'AddVentas',
  components: { Add, Search },
  setup () {
    const rows = ref([]);
    const listClientes = ref([]);
    const imprimir = ref(true);
    const modalAgregarCliente = ref(false);
    const modalBuscarProducto = ref(false);
    const productos = ref([]);
    const numFacturaCargado = ref( false );
    const loadingState = ref(false)
    const { mostrarNotify } = useHelpers();
    const $q = useQuasar();
    let fechaActual = '';
    const pagination = ref({
      sortBy: 'desc',
      descending: false,
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 25
    })

    const formVenta = ref({
      cliente_id: 'CONSUMIDOR FINAL',
      numComprobante: '',
    });
    const filterByCodBarra = ref('');

    //Tomar fecha actual
    const timeStamp   = Date.now()
    fechaActual = date.formatDate(timeStamp, 'DD/MM/YYYY')

    const router = useRouter();
    const authUserStore = useAuthUserStore();

    const { claim: { user } } = JWT.read(authUserStore.token);

    const agregarAndValidarStock = ( data ) => {
      if ( data.fracciones_total < 1 ) {
          loadingState.value = false
          filterByCodBarra.value = ''
          return mostrarNotify('warning', 'No hay stock de este producto...');
        }

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
      let fraccionesAVender = (row.fxc * row.cant_venta) + parseInt(row.f_c)

      if ( row.f_c >= row.fxc ) {
        const caja = parseInt(fraccionesAVender / row.fxc);
        const fraccionesRestante = fraccionesAVender % row.fxc;

        row.cant_venta = caja;
        row.f_c = fraccionesRestante;
      }

      row.v_total = (fraccionesAVender * row.p_unit).toFixed(2)
    }

    const quitarArticulo = ( articulo_id ) => {
      const indice = rows.value.findIndex( row => row.id == articulo_id )
      rows.value.splice(indice, 1);
    }

    const getNoFactura = async () => {
      numFacturaCargado.value = true

      let pv_busqueda = 0;
      if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
        pv_busqueda = authUserStore.pv_selected_admin
      else
        pv_busqueda = user.pv_id

      try {
        const { data: { numeroSecuencial } } = await Api.get(`/ventas/getNoFactura/${ pv_busqueda }`);
        formVenta.value.numComprobante = numeroSecuencial
      } catch (error) {
        console.log(error)
      }
      numFacturaCargado.value = false
    }

    const getClientes = async () => {
      //Cerrar modal de agregar cliente
      modalAgregarCliente.value = false;
      try {
        const { data: { clientes } } = await Api.get('/clientes');

        listClientes.value = [];

        clientes.forEach(cliente => {
          if ( cliente.nombres != 'CONSUMIDOR FINAL' ) {
            listClientes.value.push({
              label: cliente.nombres,
              value: cliente.id,
              cedula: cliente.num_documento
            })
          }
        });

        listClientes.value.push({ label: 'CONSUMIDOR FINAL', value: 0, cedula: '0' });
        optionsClients = listClientes.value;
      } catch (error) {
        console.log(error)
      }
    }

    const valorFactura = computed(() => {
      let subtotal = 0, iva = 0, descuento = 0, total = 0;
      rows.value.forEach( row => {

        if ( row.aplicaIva == 'SI' ){
          // if ( row.descuento > 0 ){
          //   descuento += (row.v_total * row.descuento) / 100
          //   iva += (parseFloat( row.v_total ) - descuento) * 0.12  
          // } else{
            iva += parseFloat( row.v_total ) * 0.12  
          // }
        }

        if ( row.descuento > 0 ) 
          descuento += (row.v_total * row.descuento) / 100
        
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
      if (rows.value.length == 0) return mostrarNotify('warning', 'Debes agregar algun producto..');

      if (parseFloat(valorFactura.value.total) > 50 && formVenta.value.cliente_id == "CONSUMIDOR FINAL") 
        return mostrarNotify('warning', 'No es posible emitir factura que superen $50 como CONSUMIDOR FINAL');

      rows.value.forEach( (articulo, index) => {
        let fraccionesAVender = (articulo.fxc * articulo.cant_venta) + parseInt(articulo.f_c);
        if (fraccionesAVender > articulo.fracciones_total) {
          mostrarNotify('negative', `la cantidad de venta del articulo ${ articulo.producto } es superior al stock disponible`);
          return;
        }        
      })

      let pv_busqueda = 0;
      if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
        pv_busqueda = authUserStore.pv_selected_admin
      else
        pv_busqueda = user.pv_id

      formVenta.value.usuario_id = user.id
      formVenta.value.usuario_name = `${ user.nombres.split(' ')[0] } ${ user.apellidos }`
      formVenta.value.pv_id = pv_busqueda
      formVenta.value.detalle = rows.value
      formVenta.value.valoresFactura = valorFactura.value
      formVenta.value.imprimir = imprimir.value

      try {
        $q.dialog({
          title: '¿Deseas Agregar esta Venta?',
          ok: { push: true, label: 'Agregar' },
          cancel: { push: true, color: 'blue-grey-6', label: 'Cancelar' }
        }).onOk(async () => {
          $q.loading.show({message: 'Cargando...'});

          await Api.post('/ventas/add', formVenta.value)

          $q.loading.hide();

          mostrarNotify('positive', 'Venta realizado exitosamente');

          router.push('/ventas');
        })
      } catch (error) {
        console.log(error);
        $q.loading.hide();
      }
    }

    getNoFactura();
    getClientes();

    return {
      addArticle,
      calcularCostoVentaProducto,
      columns,
      formVenta,
      fechaActual,
      filterByCodBarra,
      imprimir,
      filterArticulo,
      listClientes,
      loadingState,
      getClientes,
      modalAgregarCliente,
      modalBuscarProducto,
      numFacturaCargado,
      productos,
      rows,
      valorFactura,
      pagination,
      router,
      filterFn (val, update) {
        if (val === '') {
          update(() => { listClientes.value = optionsClients })
          return
        }
        update(() => {
          const needle = val.toLowerCase()
          listClientes.value = listClientes.value.filter(v =>
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
