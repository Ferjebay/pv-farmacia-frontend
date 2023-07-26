<template>
  <q-page>
    <div class="row q-py-lg q-pl-md" :class="$q.screen.xs ? 'justify-center' : 'justify-between'">
      <div class="col-md-6">
        <label class="text-h6">Listado de Usuarios</label>
      </div>
      <div class="col-md-6 flex justify-end">
        <q-btn color="secondary" v-if="validarPermisos('Agregar Usuario') && !$q.screen.xs"
        icon-right="person_add" label="Agregar Usuario" class="q-mr-md"
        @click="modalCrearUsuario = !modalCrearUsuario" />
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 col-xs-12">
        <div class="q-pa-md">
          <q-table
            class="my-sticky-header-table"
            :rows="rows"
            :columns="columns"
            :loading="loading"
            :filter="filter"
            row-key="name">

            <template v-slot:top>

              <q-space />
              <q-input dense debounce="300" color="primary" v-model="filter" label="Buscar Usuario">
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

            <template v-slot:body-cell-pv="props">
              <q-td :props="props">
                {{ props.row.punto_venta }}
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
                v-if="validarPermisos('Editar Usuario') && props.row.estado"
                @click="editarUsuario(props.row)"
                icon="edit"
                class="q-mr-sm"
                size="11px" />

                <template v-if="props.row.estado">
                  <q-btn round color="blue-grey"
                  icon="close"
                  @click="activarDesactivarUser(props.row.id, false)"
                  size="11px" />
                </template>

                <template v-else>
                  <q-btn round color="positive"
                  class="q-mr-sm"
                  icon="done"
                  @click="activarDesactivarUser(props.row.id, true)"
                  size="11px" />

                  <q-btn round color="deep-orange"
                  icon="delete"
                  @click="eliminarUsuario(props.row.id)"
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
    v-if="$q.screen.xs && validarPermisos('Agregar Usuario')">
      <q-btn round color="secondary" size="lg"
        icon="add" @click="modalCrearUsuario = !modalCrearUsuario" />
  </q-page-sticky>

  <q-dialog v-model="modalCrearUsuario">
    <AgregarUsuario @actualizarLista="getUsuarios" />
  </q-dialog>

  <q-dialog v-model="modalEditarUsuario">
    <EditarUsuario :userData="userData" @actualizarLista="getUsuarios" />
  </q-dialog>

</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import Api from "../../../apis/Api"
import AgregarUsuario from './AgregarUsuario.vue'
import EditarUsuario from './EditarUsuario.vue'
import useRolPermisos from "../../../composables/useRolPermisos";
import {  Dialog } from 'quasar'
import JWT from 'jwt-client'
import { useAuthUserStore } from "stores/auth-user"

import useHelpers from "../../../composables/useHelpers";
const columns = [
  { name: 'id', label: '#', align: 'left', field: 'id', sortable: true },
  { name: 'usuario', label: 'Usuario', align: 'left', field: 'usuario', sortable: true },
  { name: 'rol', align: 'center', label: 'Rol', field: 'rol' },
  { name: 'pv', align: 'center', label: 'Punto de Venta', field: 'punto_venta' },
  { name: 'email', label: 'Email', field: 'email', align: 'center'},
  { name: 'cedula', label: 'Cedula', field: 'cedula',  align: 'center' },
  { name: 'celular', label: 'Celular', field: 'celular',  align: 'center' },
  { name: 'estado', label: 'Estado', align: 'center', field: 'estado' },
  { name: 'acciones', label: 'acciones', align: 'center' }
]

export default defineComponent({
  name: 'IndexUsuario',
  components: { AgregarUsuario, EditarUsuario },
  setup () {
    const { validarPermisos } = useRolPermisos();
    const filter = ref('')
    const rows = ref([]);
    const loading = ref(true);
    const { mostrarNotify } = useHelpers();
    const modalCrearUsuario = ref(false);
    const modalEditarUsuario = ref(false);
    const userData = ref({});
    const formUsuario = ref({
      nombres: '',
      apellidos: '',
      cedula: '',
      celular: '',
      email: '',
      password: '',
    })
    const authUserStore = useAuthUserStore();
    const { claim: { user } } = JWT.read(authUserStore.token);

    const getUsuarios = async () => {
      //ocultar modales
      modalCrearUsuario.value = false
      modalEditarUsuario.value = false
      loading.value = true;
      try {
        let { data: { usuarios } } = await Api.get('/usuarios');

        usuarios.map( user => user.usuario = `${ user.nombres } ${ user.apellidos }` )

        if ( user.rol_name != 'SUPER-ADMINISTRADOR' ) 
          usuarios = usuarios.filter( user => user.rol != 'SUPER-ADMINISTRADOR')

        rows.value = usuarios;
      } catch (error) {
        console.log(error)
      }
      loading.value = false;
    }

    getUsuarios();

    const activarDesactivarUser = async (usuario_id, estado) => {
      try {
        await Api.delete(`/usuarios/${ usuario_id }/${ estado }`)
        mostrarNotify('positive', `Usuario ${ estado ? 'Activado' : 'Inactivado' } exitosamente`);
        getUsuarios();
      } catch (error) {
        console.log(error);
      }
    }

    const eliminarUsuario = async (usuario_id) => {
      Dialog.create({
        title: '¿Deseas Eliminar a este usuario?',
        message: 'Una vez eliminado no podra recuperarse...!',
        ok: { push: true, label:'Eliminar', color: 'teal-7' },
        cancel: { push: true, color: 'blue-grey-8', label: 'Cancelar' }
      }).onOk(async () => {
          try {
            await Api.delete(`/usuarios/${ usuario_id }`)
            mostrarNotify('positive', 'Usuario eliminado exitosamente');
            getUsuarios();
          }catch(error) {
            mostrarNotify('negative', error.response.data.message);
          }
        })
    }

    const onSubmit = async () => {
      const resultado = await Api.post('/usuarios', formUsuario.value)
      console.log(resultado);
    }

    const editarUsuario = ( user ) =>{
      userData.value = user;
      modalEditarUsuario.value = true;
    }

    watch(formUsuario.value, (currentValue, oldValue) => {
      formUsuario.value.nombres = currentValue.nombres.toUpperCase();
      formUsuario.value.apellidos = currentValue.apellidos.toUpperCase()
    });

    return {
      editarUsuario,
      eliminarUsuario,
      modalCrearUsuario,
      modalEditarUsuario,
      activarDesactivarUser,
      columns,
      formUsuario,
      filter,
      loading,
      getUsuarios,
      onSubmit,
      isPwd: ref(true),
      rows,
      userData,
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
