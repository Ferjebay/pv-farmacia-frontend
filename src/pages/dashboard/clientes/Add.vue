<template>
  <q-card style="width: 600px; max-width: 80vw;">
    <q-card-section>
      <div class="text-h6">Agregar Cliente</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit">
        <div class="row q-gutter-sm justify-around">
          <div class="col-xs-12 col-sm-11">
            <label>Nombres:</label>
            <q-input v-model.trim="formCliente.nombres" dense filled required />
          </div>

          <div class="col-xs-12 col-sm-5 q-my-md">
            <label>Tipo de Documento:</label>
            <q-select v-model.trom="formCliente.tipo_documento" dense filled :options="options" required />
          </div>

          <div class="col-xs-12 col-sm-5 q-my-md">
            <label>Numero de Documento:</label>
            <q-input v-model.trim="formCliente.num_documento" 
              type="number" dense filled required />
          </div>

          <div class="col-xs-12 col-sm-5 q-my-md">
            <label>Email:</label>
            <q-input v-model.trim="formCliente.email" type="email" dense filled required />
          </div>

          <div class="col-xs-12 col-sm-5 q-my-md">
            <label>Celular:</label>
            <q-input v-model.trim="formCliente.celular" type="number" dense filled required />
          </div>

          <div class="col-xs-12 col-sm-11">
            <label>Dirección:</label>
            <q-input v-model="formCliente.direccion" dense filled required />
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
  name: 'AgregarCliente',
  setup(_,  { emit }) {

    const loading = ref( false );
    const formCliente = ref({
      nombres: '',
      tipo_documento: '',
      num_documento: '',
      email: '',
      celular: '',
      direccion: ''
    })

    const $q = useQuasar()

    const onSubmit = async () => {
      try {
        loading.value = true;

        if ( formCliente.value.tipo_documento == '' ) {
          loading.value = false;
          return $q.notify({ color: 'negative',
            message: 'Debes elegir un tipo de documento',
            icon: 'warning'
          })  
        }
        if ( formCliente.value.num_documento.length != 10 && formCliente.value.tipo_documento == 'Cedula' ) {
          loading.value = false;
          return $q.notify({ color: 'negative',
            message: 'El numero de Cedula debe tener un total de 10 digitos',
            icon: 'warning'
          })  
        }
        if ( formCliente.value.num_documento.length != 13 && formCliente.value.tipo_documento == 'RUC' ) {
          loading.value = false;
          return $q.notify({ color: 'negative',
            message: 'El numero de RUC debe tener un total de 13 digitos',
            icon: 'warning'
          })  
        }

        await Api.post('/clientes', formCliente.value)
        emit('actualizarLista');
        $q.notify({
          color: 'positive',
          message: 'Cliente Agregado Exitosamente',
          icon: 'done'
        })
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
      }
    }

    watch(formCliente.value, (currentValue, oldValue) => {
      formCliente.value.nombres = currentValue.nombres.toUpperCase();
    });

    return {
      formCliente,
      loading,
      onSubmit,
      options: [
        'Cedula', 'RUC', 'Pasaporte'
      ]
    }
  }
})
</script>
