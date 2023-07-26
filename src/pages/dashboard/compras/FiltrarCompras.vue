<template>
  <div class="col-md-9 flex items-center">
    <label>Filtrar Por:</label>

    <q-input class="q-ml-md" style="width: 20%"
      filled v-model="formFiltrarCompras.desde" dense
      mask="date" clearable clear-icon="close">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="formFiltrarCompras.desde" :locale="myLocale">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
    </q-input>

    <label class="q-mx-md">HASTA:</label>

    <q-input filled style="width: 20%"
      v-model="formFiltrarCompras.hasta" dense
      mask="date" clearable clear-icon="close">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="formFiltrarCompras.hasta" :locale="myLocale">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Cerrar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
    </q-input>

    <q-select v-if="user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR'"
      filled required dense emit-value map-options style="width: 29%;margin-left: 27px;"
        v-model="formFiltrarCompras.pv_id" :options="listPV">
        <template v-if="formFiltrarCompras.pv_id !== ''" v-slot:append>
          <q-icon name="cancel"
            @click.stop.prevent="formFiltrarCompras.pv_id = ''" class="cursor-pointer" />
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No hay resultados
            </q-item-section>
          </q-item>
        </template>
    </q-select>

    <q-btn round color="black" icon="search" :loading="loading"
      class="q-ml-md" @click="filtarVentas" />
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import Api from "../../../apis/Api"
import useHelpers from "../../../composables/useHelpers";
import { useAuthUserStore } from "stores/auth-user"

export default defineComponent({
  name: 'FiltrarVentas',
  props: ['user', 'formFiltrarCompras'],
  setup(props,  { emit }) {
    const authUserStore = useAuthUserStore();
    const listPV = ref([]);
    const loading = ref( false );
    const { mostrarNotify } = useHelpers();

    const getPV = async () => {
      try {
        const { data: { pv } } = await Api.get('/ventas/getPV');
        listPV.value = [];

        pv.forEach(punto => {
          listPV.value.push({ label: punto.nombre, value: punto.id })
        });

      } catch (error) {
        console.log(error)
      }
    }

    const filtarVentas = async() => {
      if ( props.formFiltrarCompras.desde != '' && props.formFiltrarCompras.hasta == '' )
      return mostrarNotify('warning', 'Completa los campos de fecha de busqueda');

      if ( props.formFiltrarCompras.desde == '' && props.formFiltrarCompras.hasta != '' )
      return mostrarNotify('warning', 'Completa los campos de fecha de busqueda');

      if ( props.formFiltrarCompras.desde > props.formFiltrarCompras.hasta )
        return mostrarNotify('warning', 'Error en el rango de fecha de busqueda');

      loading.value = true;
      try {

        if (props.formFiltrarCompras.pv_id == '') {
          if(props.user.rol_name == 'ADMINISTRADOR' || props.user.rol_name == 'SUPER-ADMINISTRADOR')
            props.formFiltrarCompras.pv_id = authUserStore.pv_selected_admin
          else
            props.formFiltrarCompras.pv_id = props.user.pv_id
        }

        const { data } = await Api.post('/compras/consulta', props.formFiltrarCompras);
        emit('actualizarLista', data);

      } catch (error) {
        console.log(error);
      }
      loading.value = false;
    }

    getPV();

    return {
      listPV,
      loading,
      filtarVentas,
      myLocale: {
        /* starting with Sunday */
        days: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
        daysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
        months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
        monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
        firstDayOfWeek: 1, // 0-6, 0 - Sunday, 1 Monday, ...
        format24h: true,
        pluralDay: 'dias'
      }
    }
  }
})
</script>

