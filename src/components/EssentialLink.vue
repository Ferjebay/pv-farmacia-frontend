<template>
  <q-item
    v-if="authUserStore.permisos !== null && authUserStore.permisos.includes(permisoRequerido)"
    clickable :to="link" exact active-class="bg-light-blue-9">

    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router';
import { useAuthUserStore } from "stores/auth-user"

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: '#'
    },
    icon: {
      type: String,
      default: ''
    },
    permisoRequerido:{
      type: String
    }
  },
  setup(props, _){
    const authUserStore = useAuthUserStore();
    const router = useRouter();
    const route = useRoute();
    const linkActive = ref( false );

    const activarItem = () => {
      router.push(props.link)
      
      console.log( route.name );
    }

    return {
      authUserStore,
      activarItem,
      router
    }
  }
})
</script>
