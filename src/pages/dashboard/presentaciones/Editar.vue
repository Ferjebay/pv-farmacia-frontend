<template>
  <q-card style="width: 600px; max-width: 80vw;">
    <q-card-section>
      <div class="text-h6">Agregar Presentación</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit">
        <div class="row q-gutter-sm justify-around">
          <div class="col-xs-12 col-sm-11">
            <label>Descripción:</label>
            <q-input v-model.trim="formPresentacion.nombre" dense filled required />
          </div>

          <div class="col-xs-9 col-sm-12  flex justify-center">
            <q-btn label="Editar" class="q-px-xl" type="submit" color="green-9"/>
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
  name: 'EditarPresentacion',
  props: ['presentacionData'],
  setup(props,  { emit }) {

    const loading = ref( false );

    const { id, nombre } = props.presentacionData;
    const formPresentacion = ref({ nombre, id })

    const $q = useQuasar()

    const onSubmit = async () => {
      try {
        loading.value = true;
        const { data } = await Api.put('/presentaciones', formPresentacion.value)

        emit('getPresentaciones');
        $q.notify({
          color: 'positive',
          message: data.msg,
          icon: 'done'
        })
        loading.value = false;
      } catch (error) {
        console.log(error);
        loading.value = false;
      }
    }

    watch(formPresentacion.value, (currentValue, oldValue) => {
      formPresentacion.value.nombre = currentValue.nombre.toUpperCase();
    });

    return {
      formPresentacion,
      onSubmit
    }
  }
})
</script>
