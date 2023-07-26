<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-deep-purple-10">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title>
          <div class="row">
            <div class="col-sm-5">
              
            <q-select v-if="user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR'"
              filled required dense emit-value map-options v-model="pv_selected" :options="listPV" label-color="black" label="ESCOGA PUNTO DE VENTA" bg-color="blue-grey-5" style="width: 60%;" class="q-ml-xl">
            </q-select>

            </div>
            <div class="col-sm-6 text-right">
              ROL: {{ user.rol_name }}
            </div>
          </div>
        </q-toolbar-title>

        <div>
          <q-btn square color="negative" @click="cerrarSesion" icon="logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered style="background-color: #122F3B;" class="text-blue-grey-11">
      <q-list>
        <q-item-label header class="text-center q-pb-none text-h5 text-weight-bold text-blue-grey-11">
          Bienvenido:
        </q-item-label>
        <q-item-label header class="text-center text-subtitle1 q-pt-xs text-blue-grey-11">
          {{ `${ user.nombres.split(' ')[0] }  ${ user.apellidos }` }}
        </q-item-label>
        <q-item-label class="text-blue-grey-13" header>
          MODULOS:
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />

      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useAuthUserStore } from "stores/auth-user"
import { useRouter } from 'vue-router'
import JWT from 'jwt-client'
import Api from "../apis/Api"

const linksList = [
  {
    title: 'Usuarios',
    icon: 'fa fa-users',
    link: '/usuarios',
    permisoRequerido: 'Ver Usuarios'
  },
  {
    title: 'Puntos de Ventas',
    icon: 'fa fa-shop',
    link: '/pv',
    permisoRequerido: 'Ver PV'
  },
  {
    title: 'Proveedores',
    icon: 'fa fa-truck',
    link: '/proveedor',
    permisoRequerido: 'Ver Proveedores'
  },
  {
    title: 'Clientes',
    icon: 'fa fa-user-tag',
    link: '/clientes',
    permisoRequerido: 'Ver Clientes'
  },
  {
    title: 'Roles',
    icon: 'fa fa-user-gear',
    link: '/roles',
    permisoRequerido: 'Ver Roles'
  },
  {
    title: 'Categorias',
    icon: 'fa-solid fa-tags',
    link: '/categorias',
    permisoRequerido: 'Ver Categorias'
  },
  {
    title: 'Presentaciones',
    icon: 'fa-solid fa-clipboard-list',
    link: '/presentaciones',
    permisoRequerido: 'Ver Presentaciones'
  },
  {
    title: 'Laboratorios',
    icon: 'fa-solid fa-prescription-bottle',
    link: '/laboratorios',
    permisoRequerido: 'Ver Laboratorios'
  },
  {
    title: 'Productos',
    icon: 'fa-solid fa-pills',
    link: '/articulos',
    permisoRequerido: 'Ver Articulos'
  },
  {
    title: 'Compras',
    icon: 'fa-solid fa-cart-shopping',
    link: '/compras',
    permisoRequerido: 'Ver Articulos'
  },
  {
    title: 'Ventas',
    icon: 'fa fa-cash-register',
    link: '/ventas',
    permisoRequerido: 'Ver Ventas'
  },
  {
    title: 'Productos por Vencer',
    icon: 'fa fa-cash-register',
    link: '/caducados', 
    permisoRequerido: 'Ver Productos Caducados'
  },
]

export default defineComponent({
  name: 'MainLayout',
  components: { EssentialLink },
  setup () {
    const leftDrawerOpen = ref(false)
    const authUserStore = useAuthUserStore();
    const router = useRouter();
    const listPV = ref([]);
    const pv_selected = ref('');

    const { claim: {user} } = JWT.read(authUserStore.token);

    // const registrarInactividad = () => {
    //     var t;
    //     window.onload = reiniciarTiempo;
    //     // Eventos del DOM
    //     document.onmousemove = reiniciarTiempo;
    //     document.onkeypress = reiniciarTiempo;
    //     document.onload = reiniciarTiempo;
    //     document.onmousemove = reiniciarTiempo;
    //     document.onmousedown = reiniciarTiempo; // aplica para una pantalla touch
    //     document.ontouchstart = reiniciarTiempo;
    //     document.onclick = reiniciarTiempo;     // aplica para un clic del touchpad
    //     document.onscroll = reiniciarTiempo;    // navegando con flechas del teclado
    //     document.onkeypress = reiniciarTiempo;

    //     function tiempoExcedido() {
    //       authUserStore.$reset();
    //       window.location = '/login'
    //     }

    //     function reiniciarTiempo() {
    //       clearTimeout(t);

    //       t = setTimeout(tiempoExcedido, 600000)
    //       // 1000 milisegundos = 1 segundo
    //     }
    // };

    // registrarInactividad();

    const getPV = async () => {
      try {
        const { data: { pv } } = await Api.get('/ventas/getPV');
        listPV.value = [];

        pv.forEach(punto => {
          if (punto.nombre !== 'OTROS-JEFE' && punto.estado) 
            listPV.value.push({ label: punto.nombre, value: punto.id })            
        });

        if ( authUserStore.pv_selected_admin == null ) {
          pv_selected.value = pv[0].id
          authUserStore.setPV( pv[0].id );          
        }else{
          pv_selected.value = authUserStore.pv_selected_admin
        }

      } catch (error) {
        console.log(error)
      }
    }

    watch(pv_selected, ( newValue, _ ) => {
      authUserStore.setPV( pv_selected.value )
    })

    onMounted(() => {
      if ( user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR' ) {
        getPV();
      }
    })


    const cerrarSesion = () => {
      authUserStore.$reset();
      router.push('/login');
    }

    return {
      cerrarSesion,
      essentialLinks: linksList,
      leftDrawerOpen,
      listPV,
      pv_selected,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      user
    }
  }
})
</script>
