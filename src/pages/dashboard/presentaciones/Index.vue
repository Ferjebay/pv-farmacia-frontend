<template>
  <q-page>
    <div class="row q-py-lg q-pl-md" :class="$q.screen.xs ? 'justify-center' : 'justify-between'">
      <div class="col-md-6">
        <label class="text-h6">Listado de Presentaciones</label>
      </div>
      <div class="col-md-6 flex justify-end">
        <q-btn color="secondary" v-if="validarPermisos('Agregar Presentacion') && !$q.screen.xs"
        icon-right="add_circle" label="Nuevo" class="q-mr-md"
        @click="modalAgregarPresentacion = !modalAgregarPresentacion"
        />
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
                <template v-if="props.value">
                  <q-badge outline color="positive" label="Activo" class="q-pa-sm" />
                </template>
                <template v-else>
                  <q-badge outline color="red" label="Inactivo" class="q-pa-sm" />
                </template>
              </q-td>
            </template>

            <template v-slot:body-cell-acciones="props">
              <q-td :props="props">
                <q-btn round color="primary"
                v-if="validarPermisos('Editar Presentacion')"
                @click="editarPresentacion(props.row)"
                icon="edit"
                class="q-mr-sm"
                size="11px" />

                <template v-if="props.row.estado">
                  <q-btn round color="deep-orange"
                  v-if="props.row.estado && validarPermisos('Inactivar Presentacion')"
                  icon="close"
                  @click="activarDesactivarPresentaciones(props.row.id, false)"
                  size="11px" />
                </template>

                <template v-else>
                  <q-btn round color="positive"
                  v-if="!props.row.estado && validarPermisos('Activar Presentacion')"
                  icon="done"
                  @click="activarDesactivarPresentaciones(props.row.id, true)"
                  size="11px" />

                  <q-btn round color="deep-orange" class="q-ml-sm"
                    v-if="!props.row.estado && validarPermisos('Eliminar Presentacion')"
                    icon="delete"
                    @click="eliminarPresentacion(props.row.id)"
                    size="11px" />
                </template>

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
      v-if="$q.screen.xs && validarPermisos('Agregar Presentacion')">
    <q-btn round color="secondary" size="lg" icon="add" @click="modalAgregarPresentacion = !modalAgregarPresentacion" />
  </q-page-sticky>

  <q-dialog v-model="modalAgregarPresentacion">
    <Add @getPresentaciones="getPresentaciones" />
  </q-dialog>

  <q-dialog v-model="modalEditarPresentaciones">
    <Editar :presentacionData="presentacionData" @getPresentaciones="getPresentaciones" />
  </q-dialog>

</template>

<script>
import { defineComponent, ref } from 'vue'
import { Dialog } from 'quasar'
import Api from "../../../apis/Api"
import useRolPermisos from "../../../composables/useRolPermisos";
import useHelpers from "../../../composables/useHelpers";
import Add from './Add.vue'
import Editar from './Editar.vue'
const columns = [
  { name: 'id', label: '#', align: 'left', field: 'id', sortable: true },
  { name: 'descripcion', align: 'center', label: 'Descripción', field: 'nombre', sortable: true },  
  { name: 'estado', label: 'Estado', align: 'center', field: 'estado' },
  { name: 'acciones', label: 'acciones', align: 'center' }
]

export default defineComponent({
  name: 'IndexPresentaciones',
  components: { Add, Editar },
  setup () {
    const { validarPermisos } = useRolPermisos();
    const filter = ref('')
    const rows = ref([]);
    const modalAgregarPresentacion = ref(false);
    const modalEditarPresentaciones = ref(false);
    const loading = ref( false );
    const presentacionData = ref({});
    const { mostrarNotify } = useHelpers();

    const getPresentaciones = async () => {
      //ocultar modales
      modalAgregarPresentacion.value = false
      modalEditarPresentaciones.value = false
      loading.value = true;
      try {
        const { data: { presentaciones } } = await Api.get('/presentaciones/false');
        rows.value = presentaciones;
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    const activarDesactivarPresentaciones = async (presentaciones_id, estado) => {
      try {
        await Api.delete(`/presentaciones/${ presentaciones_id }/${ estado }`)
        mostrarNotify('positive', 'Estado cambiado exitosamente');
        getPresentaciones();
      } catch (error) {
        console.log(error);
      }
    }

    const eliminarPresentacion = async (presentacion_id) => {
      Dialog.create({
        title: '¿Deseas Eliminar esta presentación?',
        message: 'Una vez eliminado no podra recuperarse...!',
        ok: { push: true, label:'Eliminar', color: 'teal-7' },
        cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
      }).onOk(async () => {
          try {
            const { data } = await Api.delete(`/presentaciones/${ presentacion_id }`)
            mostrarNotify('positive', data.msg);
            getPresentaciones();
          }catch(error) {
            mostrarNotify('negative', error.response.data.message);
          }
        })
    }

    const editarPresentacion = ( presentacion ) =>{
      presentacionData.value = presentacion;
      modalEditarPresentaciones.value = true;
    }

    getPresentaciones();

    return {
      activarDesactivarPresentaciones,
      columns,
      editarPresentacion,
      eliminarPresentacion,
      filter,
      getPresentaciones,
      loading,
      modalAgregarPresentacion,
      modalEditarPresentaciones,
      presentacionData,
      rows,
      validarPermisos
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
