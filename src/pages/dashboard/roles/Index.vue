<template>
  <q-page>
    <div class="row q-py-lg q-pl-md" :class="$q.screen.xs ? 'justify-center' : 'justify-between'">
      <div class="col-md-6">
        <label class="text-h6">Listado de Roles</label>
      </div>
      <div class="col-md-6 flex justify-end">
        <q-btn v-if="validarPermisos('Agregar Rol') && !$q.screen.xs" class="q-mr-md"
          color="secondary" icon-right="add_circle" label="nuevo"
          @click="modalAgregarRol = true"
        />
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 col-xs-12">
        <div class="q-pa-md">
          <q-table v-if="validarPermisos('Ver Roles')"
            class="my-sticky-header-table"
            :rows="rows"
            :loading="loading"
            :columns="columns"
            row-key="name">

            <template v-slot:body-cell-acciones="props">
              <q-td :props="props">
                <q-btn v-if="validarPermisos('Editar Rol')"
                round color="primary"
                @click="editarRol(props.row)"
                icon="edit"
                class="q-mr-sm"
                size="13px" />

                <q-btn v-if="validarPermisos('Eliminar Rol')"
                @click="eliminarRol( props.row.id )"
                round color="deep-orange"
                icon="close"
                size="13px" />

              </q-td>
            </template>

            <template v-slot:body-cell-id="props">
              <q-td :props="props">
                {{  props.pageIndex + 1  }}
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
    </div>
  </q-page>

  <q-page-sticky position="bottom-right" :offset="[18, 18]"
      v-if="$q.screen.xs && validarPermisos('Agregar Rol')">
    <q-btn round color="secondary" size="lg"
        icon="add" @click="modalAgregarRol = true" />
  </q-page-sticky>

  <q-dialog v-model="modalAgregarRol">
    <AgregarRol @actualizarLista="getRoles" />
  </q-dialog>

  <q-dialog v-model="modalEditarRol">
    <EditarRol @actualizarLista="getRoles" :rolData="rolData" />
  </q-dialog>

</template>

<script>
import { defineComponent, ref } from 'vue'
import Api from "../../../apis/Api"
import AgregarRol from './AgregarRol.vue'
import EditarRol from './EditarRol.vue'
import useRolPermisos from "../../../composables/useRolPermisos";
import { Loading, Dialog } from 'quasar'
import useHelpers from "../../../composables/useHelpers";

const columns = [
  { name: 'id', label: '#', align: 'left', field: 'id', sortable: true },
  { name: 'rol', label: 'Nombre del Rol', align: 'left', field: 'nombre', sortable: true },
  { name: 'acciones', label: 'acciones', align: 'center' }
]

export default defineComponent({
  name: 'IndexUsuario',
  components: { AgregarRol, EditarRol },
  setup () {
    const rows = ref([]);
    const modalAgregarRol = ref( false );
    const modalEditarRol = ref( false );
    const { mostrarNotify } = useHelpers();
    const rolData = ref({});
    const loading = ref( false );
    const { validarPermisos } = useRolPermisos();

    const getRoles = async () => {
      modalAgregarRol.value = false
      modalEditarRol.value = false
      loading.value = true
      try {
        const { data: { roles } } = await Api.get('/roles');
        rows.value = roles;
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    getRoles();

    const editarRol = ( rol ) =>{
      rolData.value = rol;
      modalEditarRol.value = true;
    }

    const eliminarRol = async ( rol_id ) => {
      Dialog.create({
        title: '¿Deseas Eliminar este rol?',
        message: 'Una vez eliminado no podra recuperarse...!',
        ok: { push: true, label:'Eliminar', color: 'teal-7' },
        cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
      }).onOk(async () => {
          Loading.show({ message: 'Cargando...'})
          try {
            await Api.delete(`/roles/${ rol_id }`)
            mostrarNotify('positive', 'Rol eliminado exitosamente');
            getRoles();
          }catch(error) {
            mostrarNotify('negative', error.response.data.message);
          }
          Loading.hide()
        })
    }

    return {
      columns,
      editarRol,
      eliminarRol,
      modalAgregarRol,
      loading,
      modalEditarRol,
      getRoles,
      rolData,
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
