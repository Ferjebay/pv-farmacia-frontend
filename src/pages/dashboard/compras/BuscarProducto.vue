<template>
  <q-card style="width: 1040px; max-width: 80vw;">
    <q-card-section class="q-pb-none">
      <div class="text-h6 text-center">Buscar Producto</div>
    </q-card-section>

    <q-card-section>
      <div class="row q-gutter-sm">
       
        <div class="col-sm-12 q-my-sm">
          <q-table class="my-sticky-header-table2" :rows="rows"
            :columns="columns" :loading = "loading" hide-bottom row-key="name">

            <template v-slot:body-cell-add="props">
              <q-td :props="props">
                <q-btn v-if="pv_busqueda == props.row.pv_id"
                  round color="green-10" class="q-ml-md" size="sm"
                  @click="agregarProducto( props.row )" icon="fa-solid fa-plus" />
                
                <q-icon v-else color="blue-grey-8" class="q-ml-md" size="sm"
                  name="fa-solid fa-ban" />
              </q-td>
            </template>

            <template v-slot:body-cell-descuento="props">
              <q-td :props="props">
                  {{ props.row.descuento }}%
              </q-td>
            </template>

            <template v-slot:body-cell-pvp="props">
              <q-td :props="props">${{ props.row.pvp }}</q-td>
            </template>

            <template v-slot:body-cell-p_unit="props">
              <q-td :props="props">${{ props.row.p_unit }}</q-td>
            </template>

            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
          </q-table>
        </div>

      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useAuthUserStore } from "stores/auth-user"
import JWT from 'jwt-client'

const columns = [
  { name: 'add', label: 'Agregar', align: 'left', field: 'add' },
  { name: 'cod_barra', label: 'Codigo Barra', align: 'left', field: 'cod_barra' },
  { name: 'pv_nombre', label: 'Punto de Venta', align: 'center', field: 'pv_nombre' },
  { name: 'producto', label: 'Producto', align: 'left', field: 'producto' },
  { name: 'fxc', label: 'F. por Caja', align: 'center', field: 'fxc' },
  { name: 'cajas', label: 'Stock Cajas', align: 'center', field: 'cajas' },
  { name: 'fracciones', label: 'Stock Fracciones', align: 'center', field: 'fracciones' },
  { name: 'pvp', label: 'P. Caja', align: 'center', field: 'pvp' },
  { name: 'p_unit', label: 'P. Unit.', align: 'center', field: 'p_unit' },
  { name: 'descuento', label: 'Descuento', align: 'center', field: 'descuento' },
  { name: 'iva', label: 'IVA', align: 'center', field: 'aplicaIva' }
]

export default defineComponent({
  name: 'buscar-producto',
  props: ['productos'],
  setup(props, { emit }) {
    const rows = ref([]);
    const loading = ref(false);
    const authUserStore = useAuthUserStore();
    const { claim: { user } } = JWT.read(authUserStore.token);

    props.productos.map( p => {
      p.cajas = ( p.fracciones_total !== 0 ) ? parseInt(p.fracciones_total / p.fxc) : 0;
      p.fracciones = ( p.fracciones_total !== 0 ) ? parseInt(p.fracciones_total % p.fxc): 0
    })    
    rows.value = props.productos;

    let pv_busqueda = 0;
    if(user.rol_name == 'ADMINISTRADOR' || user.rol_name == 'SUPER-ADMINISTRADOR')
      pv_busqueda = authUserStore.pv_selected_admin
    else
      pv_busqueda = user.pv_id

    const agregarProducto = ( producto ) => {
      emit('addArticle', producto);
    }

    return {
      agregarProducto,
      columns,
      loading,
      rows,
      pv_busqueda,
      user
    }
  }
})
</script>

<style>
.my-sticky-header-table2 .q-table__top,
.my-sticky-header-table2 .q-table__bottom,
.my-sticky-header-table2 thead tr:first-child th {
  /* bg color is important for th; just specify one */
  background-color: #3d403d;
  color: rgb(245, 241, 241);
}

.my-sticky-header-table2 tbody tr:nth-child(even) {
    background-color: rgb(240, 240, 240);
}
</style>
