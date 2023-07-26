<template>
  <q-card style="width: 910px; max-width: 80vw;">
    <q-card-section class="q-pb-none">
      <div class="text-h6 text-center">Detalle de la Factura</div>
    </q-card-section>

    <q-card-section>
      <div class="row q-gutter-sm">
        <div class="col-sm-5 text-right">
          <label class="text-subtitle1 text-weight-medium">Num. Comprobantes:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-sm flex items-center">
          <label>{{ facturaData.num_comprobante }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Clave de Acceso:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ facturaData.clave_acceso }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Punto de Venta:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ facturaData.pv_nombre }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Cliente:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ facturaData.cliente }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Usuario:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ facturaData.usuario }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Fecha:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ facturaData.fecha }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Subtotal:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ subtotal }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">IVA(12%):</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ iva }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Descuento:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <label>{{ descuento }}</label>
        </div>
        <div class="col-sm-5 text-right q-mt-none">
          <label class="text-subtitle1 text-weight-medium">Total de Pago:</label>
        </div>
        <div class="col-sm-5 q-ml-lg q-mt-none flex items-center">
          <q-badge outline class="text-subtitle1 text-weight-bold"
                    color="secondary" :label=" `$${ facturaData.total.toFixed(2) }` " />
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

            <template v-slot:body-cell-descuento="props">
              <q-td :props="props">
                  {{ props.row.d_a }}%
              </q-td>
            </template>

            <template v-slot:body-cell-v_total="props">
              <q-td :props="props">${{ props.row.subtotal.toFixed(2) }}</q-td>
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
  { name: 'cajas', label: 'Cajas V.', align: 'center', field: 'cajas' },
  { name: 'fracciones', label: 'Fracciones V.', align: 'center', field: 'fracciones' },
  { name: 'pvp', label: 'P. Caja', align: 'center', field: 'pvp' },
  { name: 'p_unit', label: 'P. Unit.', align: 'center', field: 'p_unit' },
  { name: 'descuento', label: 'Descuento', align: 'center', field: 'd_a' },
  { name: 'iva', label: 'IVA', align: 'center', field: 'aplicaIva' },
  { name: 'v_total', label: 'Valor Total', align: 'center', field: 'subtotal' }
]

export default defineComponent({
  name: 'detalleFactura',
  props: ['facturaData'],
  setup(props) {
    const rows = ref([]);
    const loading = ref(false)

    const subtotal  = ref('---')
    const iva       = ref('---')
    const descuento = ref('---')

    const getDetalleVenta = async () => {
      try {
        loading.value = true;
        const { data } = await Api.get(`/ventas/${ props.facturaData.id }`);

        subtotal.value  = data.detalleVenta[0].sub_fact.toFixed(2)
        iva.value       = data.detalleVenta[0].iva.toFixed(2)
        descuento.value = data.detalleVenta[0].descuento.toFixed(2)

        rows.value = data.detalleVenta;
        loading.value = false;
      } catch (error) {
        loading.value = false;
        console.log(error)
      }
    }

    getDetalleVenta();

    return {
      columns,
      loading,
      rows,
      subtotal,
      iva,
      descuento
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
