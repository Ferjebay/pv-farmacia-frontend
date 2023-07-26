<template>
  <q-card style="width: 700px; max-width: 80vw;">
    <q-card-section class="row items-center q-pb-none text-center">
      <div class="text-h6 text-center">Editar Articulo  -  {{ pv_nombre }}</div>
      <q-space />
      <q-btn icon="close" flat round dense v-close-popup />
    </q-card-section>

    <q-card-section>
      <q-form>
        <div class="row q-gutter-md">
          <div class="offset-1 col-xs-10 col-sm-5">
            <label>Codigo de Barra:</label>
            <q-input v-model.trim="formArticulo.cod_barra" type="number" dense filled required />
          </div>

          <div class="col-xs-10 col-sm-5">
            <label>Aplica IVA:</label>
            <q-select filled required dense emit-value map-options
              v-model="formArticulo.iva" :options="['SI', 'NO']" />
          </div>

          <div class="offset-1 col-xs-10 col-sm-5 ">
            <label>Principio Activo:</label>
            <q-input v-model.trim="formArticulo.principio_activo" dense filled required />
          </div>

          <div class="col-xs-10 col-sm-5">
            <label>Producto:</label>
            <q-input v-model.trim="formArticulo.producto" dense filled required />
          </div>

          <div class="offset-1 col-xs-10 col-sm-5 ">
            <label>Categoria:</label>
            <q-select filled required dense emit-value map-options
              v-model="formArticulo.categoria_id" :options="listCategorias" />
          </div>

          <div class="col-xs-10 col-sm-5 ">
            <label>Laboratorio:</label>
            <q-select filled required dense emit-value map-options
              v-model="formArticulo.laboratorio_id" :options="listLaboratorios" />
          </div>

          <div class="offset-1 col-xs-10 col-sm-5 ">
            <label>Presentación:</label>
            <q-select filled required dense emit-value map-options
              v-model="formArticulo.presentacion_id" :options="listPresentaciones" />
          </div>

          <div class="col-xs-10 col-sm-5">
            <label>Fecha de Caducidad:</label>
            <q-input filled v-model="formArticulo.fecha_caducidad" dense
              mask="date" clearable clear-icon="close">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="formArticulo.fecha_caducidad" :locale="myLocale">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Cerrar" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
            </q-input>
          </div>
          
          <div class="offset-1 col-xs-10 col-sm-4 " 
            style="display: flex;align-items: center;justify-content: center;">
            <div class="text-h5 q-mt-sm">
              <label>
                <span class="text-green-10">C:</span>
                <span class="text-weight-regular"> {{ totalCajas }}</span>
              </label>
              <label class="q-ml-xl">
                <span class="text-green-10">F:</span>
                <span class="text-weight-regular"> {{ totalFracciones }}</span>
              </label>          
            </div>
          </div>

          <div class="col-xs-10 col-sm-2">
            <label>F. por caja:</label>
            <q-input v-model.trim="formArticulo.f_caja" type="number" @change="calcularPrecioUnit(), cajasAndFracciones()" input-class="centrarTextoInput"
              min="1" dense filled required />
          </div>
          <div class="col-xs-10 col-sm-3">
            <label>Stock Fracciones:</label>
            <q-input v-model.trim="formArticulo.f_total" @change="cajasAndFracciones"
              type="number" min="1" dense filled required input-class="centrarTextoInput" />
          </div>

          <div class="row q-gutter-md flex-center text-center">
            <div class="col-xs-10 col-sm-2">
              <label>PVM:</label>
              <q-input v-model.trim="formArticulo.pvm" input-class="centrarTextoInput"
                type="number" dense filled required />
            </div>
            <div class="col-xs-10 col-sm-2 text-center">
              <label>PVP:</label>
              <q-input v-model.trim="formArticulo.pvp" @change="calcularPrecioUnit"
                type="number" step="0.01" maxlength="3" dense filled required input-class="centrarTextoInput" />
            </div>
            <div class="col-xs-10 col-sm-2 text-center">
              <label>P. Unitario:</label>
              <q-input v-model.trim="formArticulo.p_unitario" input-class="resaltarTextoInput"
                type="number" readonly dense filled />
            </div>
            <div class="col-xs-10 col-sm-2">
              <label>Descuento %</label>
              <q-input v-model.trim="formArticulo.descuento" type="number" input-class="centrarTextoInput"
                dense filled required min="0" max="100" />
            </div>
          </div>

          <div class="col-xs-9 col-sm-12  flex justify-center">
            <q-btn @click="submit" :loading="loading"
              label="Editar" class="q-px-xl" color="green-9"/>
          </div>

        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Api from "../../../apis/Api"
import useHelpers from "../../../composables/useHelpers";
import { useAuthUserStore } from "stores/auth-user"
import JWT from 'jwt-client'

export default defineComponent({
  name: 'EditarArticulo',
  props: ['articuloData'],
  setup(props,  { emit }) {
    const authUserStore = useAuthUserStore();
    const { claim: { user } } = JWT.read(authUserStore.token);

    const { 
      id,
      aplicaIva: iva,
      cod_barra,
      producto,
      principio_activo,
      fxc: f_caja,
      fracciones_total: f_total,
      fecha_caducidad,
      pvm,
      pvp,
      p_unit,
      descuento,
      categoria_id,
      presentacion_id,
      laboratorio_id,
      pv_nombre, 
    } = props.articuloData;

    let dateArray = fecha_caducidad.split('T')[0].split('/');
    const formatoFechaCaducidad = `${ dateArray[2] }/${ dateArray[1] }/${ dateArray[0] }`

    const formArticulo = ref({
      cod_barra,
      iva,
      principio_activo,
      producto,
      categoria_id,
      presentacion_id,
      laboratorio_id,
      f_caja,
      f_total,
      fecha_caducidad: formatoFechaCaducidad,
      pvm: pvm.toFixed(2),
      pvp: pvp.toFixed(2),
      p_unitario: p_unit.toFixed(2),
      descuento
    })

    const totalCajas = ref( 0 );
    const totalFracciones = ref( 0 );
    const listLaboratorios = ref([]);
    const listCategorias = ref([]);
    const listPresentaciones = ref([]);
    const listPV = ref([]);
    const loading = ref( false );

    const calcularPrecioUnit = () => {      
      const resultado = (formArticulo.value.pvp / formArticulo.value.f_caja).toFixed(2);
      const redondeo = Math.floor(resultado * 100) / 100
      formArticulo.value.p_unitario = redondeo;
    }

    const cajasAndFracciones = () => {     
      const stock = formArticulo.value.f_total;
      const fxc =  formArticulo.value.f_caja;
      totalCajas.value = ( stock !== 0 ) ? parseInt(stock / fxc) : 0
      totalFracciones.value = ( stock !== 0 ) ? parseInt(stock % fxc): 0
    }

    const { mostrarNotify } = useHelpers();

    const getLaboratorios = async () => {
      try {
        const { data: { laboratorios } } = await Api.get('/laboratorios/true');

        listLaboratorios.value = [];

        laboratorios.forEach(laboratorio => {
            listLaboratorios.value.push({ label: laboratorio.nombre, value: laboratorio.id })
        });
      } catch (error) {
        console.log(error)
      }
    }

    const getCategorias = async () => {
      try {
        const { data: { categorias } } = await Api.get('/categorias/true');
        listCategorias.value = [];

        categorias.forEach(categoria => {
          listCategorias.value.push({ label: categoria.nombre, value: categoria.id })
        });
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    const getPresentaciones = async () => {
      try {
        const { data: { presentaciones } } = await Api.get('/presentaciones/true');
        listPresentaciones.value = [];

        presentaciones.forEach(presentacion => {
          listPresentaciones.value.push({ label: presentacion.nombre, value: presentacion.id })
        });
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    const getPV = async () => {
      try {
        const { data: { puntos_ventas } } = await Api.get('/puntos_ventas/true');
        listPV.value = [];

        puntos_ventas.forEach(punto_venta => {
          if ( punto_venta.nombre != 'OTROS-JEFE' )           
            listPV.value.push({ label: punto_venta.nombre, value: punto_venta.id })
        });

        listPV.value.unshift({ label: "AGREGAR A TODOS", value: 0 })
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    getPresentaciones();
    getLaboratorios();
    getCategorias();
    getPV();
    cajasAndFracciones()

    const submit = async () => {
      try {
        loading.value = true;

        await Api.put(`/articulos/${ id }`, formArticulo.value)
        emit('actualizarLista');
        mostrarNotify('positive', 'Articulo Editado Exitosamente');
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
      }
    }

    watch(formArticulo.value, (currentValue, _) => {
      formArticulo.value.producto = currentValue.producto.toUpperCase();
      // formArticulo.value.modelo = currentValue.modelo.toUpperCase()
    });

    return {
      calcularPrecioUnit,
      listLaboratorios,
      listCategorias,
      listPresentaciones,
      listPV,
      loading,
      formArticulo,
      submit,
      totalCajas,
      totalFracciones,
      cajasAndFracciones,
      user,
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
      pv_nombre
    }
  }
})
</script>

<style>
.resaltarTextoInput{
  font-size: 18px;
  text-align: center;
  color: #313131;
  font-weight: 500;
}
.centrarTextoInput{
  text-align: center;
}
</style>
