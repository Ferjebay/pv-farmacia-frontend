<template>
  <q-card style="width: 500px; max-width: 80vw;">
    <q-card-section>
      <div class="text-h6">Agregar Punto de Venta</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit">
        <div class="row q-gutter-sm justify-around">
          <div class="col-xs-12 col-sm-11">
            <label>Nombre:</label>
            <q-input v-model="formPV.nombre" dense filled required />
          </div>

          <div class="col-xs-12 col-sm-11">
            <label>Dirección:</label>
            <q-input v-model="formPV.direccion" dense filled required />
          </div>

          <div class="col-xs-6 col-sm-5">
            <label>Punto de Emisión:</label>
            <q-input v-model="formPV.punto_emision" input-class="text-center"
              dense filled required />
          </div>

          <div class="col-xs-6 col-sm-5">
            <label>Secuencia Factura:</label>
            <q-input v-model.trim="formPV.secuencia_factura" input-class="text-center"
              dense filled required />
          </div>

          <div class="col-xs-9 col-sm-12  flex justify-center">
            <q-btn label="Guardar" class="q-px-xl" :loading="loading"
              type="submit" color="green-9"/>
          </div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Api from "../../../apis/Api"
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'AgregarProveedor',
  setup(_,  { emit }) {

    const loading = ref( false );
    const formPV = ref({
      nombre: '',
      direccion: '',
      punto_emision: '',
      secuencia_factura: ''
    })

    const $q = useQuasar()

    const onSubmit = async () => {
      try {
        loading.value = true;
        await Api.post('/puntos_ventas', formPV.value)
        emit('actualizarLista');
        $q.notify({
          color: 'positive',
          message: 'Punto de Venta Agregado Exitosamente',
          icon: 'done'
        })
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
      }
    }

    watch(formPV.value, (currentValue, oldValue) => {
      formPV.value.nombre = currentValue.nombre.toUpperCase();
    });

    return {
      formPV,
      loading,
      onSubmit
    }
  }
})
</script>
