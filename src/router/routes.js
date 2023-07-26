
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/sesion/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'articulos',
        name: 'Ver Articulos',
        component: () => import('pages/dashboard/articulos/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'roles',
        name: 'Ver Roles',
        component: () => import('pages/dashboard/roles/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'usuarios',
        name: 'Ver Usuarios',
        component: () => import('pages/dashboard/usuarios/Index.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'pv',
        name: 'Ver PV',
        component: () => import('pages/dashboard/pv/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'proveedor',
        name: 'Ver Proveedores',
        component: () => import('pages/dashboard/proveedores/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'clientes',
        name: 'Ver Clientes',
        component: () => import('pages/dashboard/clientes/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'categorias',
        name: 'Ver Categorias',
        component: () => import('pages/dashboard/categorias/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'presentaciones',
        name: 'Ver Presentaciones',
        component: () => import('pages/dashboard/presentaciones/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'laboratorios',
        name: 'Ver Laboratorios',
        component: () => import('pages/dashboard/laboratorios/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'compras',
        name: 'Ver Compras',
        component: () => import('pages/dashboard/compras/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'compras/add',
        name: 'Agregar Compra',
        component: () => import('pages/dashboard/compras/AgregarCompra.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'ventas',
        name: 'Ver Ventas',
        component: () => import('pages/dashboard/ventas/Index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'ventas/add',
        name: 'Agregar Venta',
        component: () => import('pages/dashboard/ventas/AgregarVenta.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'caducados/',
        name: 'Ver Productos Caducados',
        component: () => import('pages/dashboard/caducados/Index.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
