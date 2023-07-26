<template>
  <q-card style="width: 840px; max-width: 80vw;">
    <q-card-section class="q-pb-none">
      <div class="text-h6 text-center">Detalle de la Factura</div>
    </q-card-section>

    <q-card-section>
      <div class="row q-gutter-sm">
        <div class="col-sm-5 text-right">
          <label class="text-subtitle1 text-weight-medium">Usuario:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-sm flex items-center">
          <label>{{ compraData.usuario }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Proveedor:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ compraData.proveedor }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Num. Comprobante:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ compraData.num_comprobante }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Descripción:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ compraData.descripcion }}</label>
        </div>        
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Fecha/Hora:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ compraData.fecha }}</label>
        </div>        
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Total de Pago:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <q-badge outline class="text-subtitle1 text-weight-bold"
                    color="secondary" :label=" `$${ compraData.total.toFixed(2) }` " />
        </div> 

        <div class="col-sm-12 q-my-sm">
          <q-table
            class="my-sticky-header-table2"
            :rows="rows"
            :columns="columns"
            :loading = "loading"
            hide-bottom
            row-key="name">
            <template v-slot:body-cell-indice="props">
              <q-td :props="props">{{  props.pageIndex + 1 }}</q-td>
            </template>

            <template v-slot:body-cell-v_total="props">
              <q-td :props="props">${{ props.row.total.toFixed(2) }}</q-td>
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
import Api from "../../../apis/Api"

const columns = [
  { name: 'cod_barra', label: 'Codigo Barra', align: 'left', field: 'cod_barra' },
  { name: 'producto', label: 'Producto', align: 'left', field: 'producto' },
  { name: 'cajas', label: 'Cajas Comprada', align: 'center', field: 'cajas' },
  { name: 'fracciones', label: 'Fracciones Compradas', align: 'center', field: 'fracciones' },
  { name: 'v_total', label: 'SubTotal', align: 'center', field: 'total' }
]

export default defineComponent({
  name: 'detalleCompra',
  props: ['compraData'],
  setup(props) {
    const rows = ref([]);
    const loading = ref(false)

    const getDetalleCompra = async () => {
      try {
        loading.value = true;

        const { data } = await Api.get(`/compras/${ props.compraData.id }`);

        rows.value = data.detalleCompras;
        loading.value = false;
      } catch (error) {
        loading.value = false;
        console.log(error)
      }
    }

    getDetalleCompra();

    return {
      columns,
      loading,
      rows
    }
  }
})
</script>

<style>
.my-sticky-header-table2 .q-table__top,
.my-sticky-header-table2 .q-table__bottom,
.my-sticky-header-table2 thead tr:first-child th {
  /* bg color is important for th; just specify one */
  background-color: #737873;
  color: rgb(245, 241, 241);
}

.my-sticky-header-table2 tbody tr:nth-child(even) {
    background-color: rgb(240, 240, 240);
}
</style>
