/**
 * i18n.js — lightweight bilingual module (Spanish default, English optional).
 *
 * Provides:
 *   - translations dict with `es` and `en` dictionaries
 *   - t(key) helper with fallback to the key itself
 *   - applyI18n() fills elements marked with [data-i18n], [data-i18n-placeholder],
 *     [data-i18n-title] and [data-i18n-html]
 *   - setLang() / toggle in the navbar, persisted in localStorage (default 'es')
 *
 * UI language: Spanish is the default (neutral/professional Spanish — no voseo).
 */

const I18N_STORAGE_KEY = "kajataca-lang";
const DEFAULT_LANG = "es";

const translations = {
  es: {
    // App
    "app.title": "Inventario Kajataca",
    "app.brand": "Kajataca",
    "app.subtitle": "Sistema de Inventario para Cervecería",
    "app.logout": "Cerrar sesión",
    "app.language": "Idioma",
    "app.unefa": "UNEFA - Proyecto Universitario",
    "theme.toggle": "Cambiar tema",

    // Modules (menu)
    "module.operations": "Operaciones",
    "module.management": "Gestión",
    "module.reports": "Reportes",
    "module.information": "Información",
    "module.inventory": "Inventario",
    "module.media": "Media",

    // Menu items
    "menu.home_view": "Dashboard",
    "menu.users_view": "Usuarios",
    "menu.users_create": "Registrar Usuarios",
    "menu.users_edit": "Modificar Usuarios",
    "menu.users_delete": "Eliminar Usuarios",
    "menu.users_toggle_status": "Cambiar Estado de Usuarios",
    "menu.companies_view": "Empresas",
    "menu.companies_create": "Registrar Empresas",
    "menu.companies_edit": "Modificar Empresas",
    "menu.companies_delete": "Eliminar Empresas",
    "menu.companies_toggle_status": "Cambiar Estado de Empresas",
    "menu.distributors_view": "Distribuidoras",
    "menu.distributors_create": "Registrar Distribuidoras",
    "menu.distributors_edit": "Modificar Distribuidoras",
    "menu.distributors_delete": "Eliminar Distribuidoras",
    "menu.distributors_toggle_status": "Cambiar Estado de Distribuidoras",
    "menu.roles_manage": "Roles",
    "menu.logs_view": "Bitácora",
    "menu.reports_view": "Reportes",
    "menu.about_view": "Acerca de",
    "menu.products_view": "Productos",
    "menu.products_create": "Registrar Productos",
    "menu.products_edit": "Modificar Productos",
    "menu.products_delete": "Eliminar Productos",
    "menu.movements_view": "Movimientos",
    "menu.movements_create": "Registrar Movimientos",
    "menu.sales_view": "Ver Ventas",
    "menu.sales_create": "Registrar Ventas",
    "menu.purchases_view": "Ver Compras",
    "menu.purchases_create": "Registrar Compras",
    "menu.music_view": "Música",
    "menu.music_manage": "Gestionar Música",
    "menu.gallery_view": "Galería",

    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.status": "Estado",
    "common.active": "Activo",
    "common.inactive": "Inactivo",
    "common.actions": "Acciones",
    "common.search": "Buscar",
    "common.confirm": "Confirmar",
    "common.yes": "Sí",
    "common.no": "No",
    "common.name": "Nombre",
    "common.description": "Descripción",
    "common.created_at": "Fecha de creación",
    "common.add": "Agregar",
    "common.close": "Cerrar",
    "common.all": "Todos",
    "common.confirm_delete": "¿Está seguro de eliminar este registro?",
    "common.confirm_status": "¿Desea cambiar el estado de este registro?",
    "common.loading": "Cargando...",
    "common.empty": "Sin registros",

    // Login
    "login.title": "Iniciar Sesión",
    "login.user": "Usuario",
    "login.password": "Contraseña",
    "login.submit": "Ingresar",
    "login.recover": "Cambiar Contraseña",
    "login.welcome": "Bienvenido al Sistema Kajataca",

    // Password recovery (3 steps)
    "rec.title": "Recuperar Contraseña",
    "rec.step1_title": "Paso 1: Verificar Cédula",
    "rec.step2_title": "Paso 2: Verificar Respuesta",
    "rec.step3_title": "Paso 3: Nueva Contraseña",
    "rec.cedula": "Cédula",
    "rec.answer": "Respuesta de seguridad",
    "rec.new_password": "Nueva contraseña",
    "rec.confirm_password": "Confirmar contraseña",
    "rec.next": "Continuar",
    "rec.back": "Volver",
    "rec.finish": "Finalizar",
    "rec.success": "Contraseña actualizada correctamente. Ya puede iniciar sesión.",
    "rec.step1_hint": "Ingrese su cédula para mostrar la pregunta de seguridad.",
    "rec.step2_hint": "Responda la pregunta de seguridad para continuar.",
    "rec.step3_hint": "Ingrese la nueva contraseña (8 a 12 caracteres, con letras, números y un carácter especial).",

    // Home
    "home.hello": "¡Hola!",
    "home.welcome_text": "le damos la bienvenida al Sistema Kajataca",
    "home.gallery_title": "Galería",
    "home.about": "Sistema de gestión de inventario para cervecería, desarrollado como proyecto universitario en la UNEFA, extensión Turén, Venezuela. Versión modernizada: Python, FastAPI y Docker.",

    // Users
    "users.title": "Consultar Usuarios",
    "users.name": "Nombre y Apellido",
    "users.nick": "Nick",
    "users.cedula": "Cédula",
    "users.password": "Contraseña",
    "users.confirm_password": "Confirmar contraseña",
    "users.role": "Tipo de Usuario",
    "users.question": "Pregunta de Seguridad",
    "users.answer": "Respuesta de Seguridad",
    "users.status": "Estado",
    "users.add": "Registrar Usuario",
    "users.edit": "Modificar Usuario",
    "users.delete": "Eliminar Usuario",
    "users.toggle_status": "Cambiar Estado",
    "users.filter_role": "Filtrar por rol",
    "users.filter_status": "Filtrar por estado",
    "users.change_password_hint": "Deje la contraseña en blanco para conservar la actual.",

    // Companies
    "companies.title": "Consultar Empresas",
    "companies.rif": "RIF",
    "companies.name": "Nombre de la Empresa",
    "companies.description": "Descripción",
    "companies.status": "Estado",
    "companies.add": "Registrar Empresa",
    "companies.edit": "Modificar Empresa",
    "companies.delete": "Eliminar Empresa",
    "companies.toggle_status": "Cambiar Estado",

    // Distributors
    "distributors.title": "Consultar Distribuidoras",
    "distributors.name": "Nombre de la Distribuidora",
    "distributors.phone": "Teléfono",
    "distributors.contact": "Contacto",
    "distributors.company": "Empresa",
    "distributors.status": "Estado",
    "distributors.add": "Registrar Distribuidora",
    "distributors.edit": "Modificar Distribuidora",
    "distributors.delete": "Eliminar Distribuidora",
    "distributors.toggle_status": "Cambiar Estado",
    "distributors.filter_company": "Filtrar por empresa",

    // Logs
    "logs.title": "Bitácora del Sistema",
    "logs.date": "Fecha y Hora",
    "logs.user": "Usuario",
    "logs.event": "Evento",
    "logs.description": "Descripción",

    // Roles
    "roles.title": "Roles y Permisos",
    "roles.name": "Rol",
    "roles.description": "Descripción",
    "roles.permissions": "Permisos",
    "roles.manage": "Gestionar Permisos",
    "roles.save": "Guardar Permisos",
    "roles.root_note": "El rol Root tiene acceso total al sistema (no requiere permisos).",
    "roles.none": "Sin permisos asignados",

    // Reports
    "reports.title": "Reportes",
    "reports.users_pdf": "Reporte de Usuarios (PDF)",
    "reports.generate": "Generar",
    "reports.description": "Genere el reporte de usuarios en formato PDF.",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Resumen general del inventario",
    "dashboard.products": "Productos",
    "dashboard.low_stock": "Stock bajo",
    "dashboard.movements_today": "Movimientos hoy",
    "dashboard.sales_today": "Ventas hoy",
    "dashboard.low_stock_title": "Productos con stock bajo",
    "dashboard.latest_movements_title": "Últimos movimientos",
    "dashboard.no_low_stock": "No hay productos con stock bajo.",
    "dashboard.no_movements": "Aún no hay movimientos registrados.",
    "dashboard.view_products": "Ver productos",
    "dashboard.view_movements": "Ver movimientos",

    // Products
    "products.title": "Productos",
    "products.name": "Producto",
    "products.company": "Empresa",
    "products.price": "Precio",
    "products.tax_rate": "IVA %",
    "products.stock": "Stock",
    "products.add": "Nuevo Producto",
    "products.edit": "Editar Producto",
    "products.delete": "Eliminar Producto",
    "products.toggle_status": "Cambiar Estado",
    "products.empty": "No hay productos registrados.",
    "products.stock_hint": "El stock se gestiona a través de los movimientos.",
    "products.activate": "Activar",
    "products.deactivate": "Desactivar",

    // Movements
    "movements.title": "Movimientos",
    "movements.tab_purchase": "Ingreso / Compra",
    "movements.tab_sale": "Salida / Venta",
    "movements.tab_history": "Historial",
    "movements.product": "Producto",
    "movements.quantity": "Cantidad",
    "movements.unit_price": "Precio unitario",
    "movements.supplier": "Proveedor (opcional)",
    "movements.client": "Cliente (opcional)",
    "movements.description": "Descripción (opcional)",
    "movements.stock": "Stock",
    "movements.register_purchase": "Registrar Compra",
    "movements.register_sale": "Registrar Venta",
    "movements.purchase_success": "Compra registrada correctamente.",
    "movements.sale_success": "Venta registrada correctamente.",
    "movements.date": "Fecha",
    "movements.type": "Tipo",
    "movements.kind": "Movimiento",
    "movements.party": "Cliente / Proveedor",
    "movements.user": "Usuario",
    "movements.no_history": "Aún no hay movimientos registrados.",
    "movements.no_products": "No hay productos activos disponibles.",
    "movements.select_product": "Seleccione un producto",

    // Movement type / kind labels
    "type.in": "Entrada",
    "type.out": "Salida",
    "kind.purchase": "Compra",
    "kind.sale": "Venta",
    "kind.adjustment": "Ajuste",

    // Gallery
    "gallery.title": "Galería",
    "gallery.subtitle": "Imágenes del establecimiento",
    "gallery.kajataca": "Kajataca",
    "gallery.kajataca2": "Kajataca 2",
    "gallery.negocio": "El Negocio",
    "gallery.banner": "Banner",
    "gallery.anuncio": "Anuncio",
    "gallery.background": "Fondo",

    // Music
    "music.title": "Música",
    "music.subtitle": "Canciones del sistema",
    "music.song_title": "Título",
    "music.file": "Archivo de audio",
    "music.upload": "Subir Canción",
    "music.uploading": "Subiendo...",
    "music.upload_success": "Canción subida correctamente.",
    "music.delete_success": "Canción eliminada.",
    "music.no_songs": "No hay canciones cargadas.",
    "music.choose_file": "Seleccione un archivo de audio",
    "music.title_required": "Ingrese un título",

    // Events (logs)
    "event.login": "Inicio de sesión",
    "event.logout": "Cierre de sesión",
    "event.create_user": "Registro de usuario",
    "event.edit_user": "Modificación de usuario",
    "event.delete_user": "Eliminación de usuario",
    "event.toggle_user_status": "Cambio de estado de usuario",
    "event.create_company": "Registro de empresa",
    "event.edit_company": "Modificación de empresa",
    "event.delete_company": "Eliminación de empresa",
    "event.toggle_company_status": "Cambio de estado de empresa",
    "event.create_distributor": "Registro de distribuidora",
    "event.edit_distributor": "Modificación de distribuidora",
    "event.delete_distributor": "Eliminación de distribuidora",
    "event.toggle_distributor_status": "Cambio de estado de distribuidora",
    "event.change_password": "Cambio de contraseña",
    "event.password_recovery": "Recuperación de contraseña",
    "event.update_role_permissions": "Actualización de permisos",
    "event.generate_report": "Generación de reporte",
    "event.create_product": "Registro de producto",
    "event.edit_product": "Modificación de producto",
    "event.delete_product": "Eliminación de producto",
    "event.toggle_product_status": "Cambio de estado de producto",
    "event.stock_in": "Entrada de stock",
    "event.stock_out": "Salida de stock",
    "event.create_sale": "Registro de venta",
    "event.create_purchase": "Registro de compra",
    "event.add_song": "Adición de canción",
    "event.delete_song": "Eliminación de canción",

    // Status
    "status.active": "Activo",
    "status.inactive": "Inactivo",

    // Error pages
    "error404.title": "Error 404 - Página no encontrada",
    "error404.text": "La página que busca no existe o fue movida.",
    "error403.title": "Error 403 - Acceso denegado",
    "error403.text": "No posee permisos suficientes para acceder a esta sección. Contacte al administrador del sistema.",
    "error505.title": "Error 505 - Error interno del servidor",
    "error505.text": "Ocurrió un error inesperado. Intente nuevamente más tarde.",
    "error.back_home": "Volver al Inicio",

    // API / validation errors (server detail keys + client messages)
    "error.invalid_credentials": "Usuario o contraseña incorrectos.",
    "error.user_inactive": "El usuario se encuentra inactivo.",
    "error.not_authenticated": "Debe iniciar sesión para continuar.",
    "error.forbidden": "No tiene permisos para realizar esta acción.",
    "error.not_found": "Registro no encontrado.",
    "error.validation": "Los datos ingresados no son válidos. Revise el formulario.",
    "error.nick_taken": "El nick ya está registrado.",
    "error.cedula_taken": "La cédula ya está registrada.",
    "error.rif_taken": "El RIF ya está registrado.",
    "error.phone_taken": "El teléfono ya está registrado.",
    "error.server": "Error interno del servidor. Intente nuevamente.",
    "error.user_not_found": "No se encontró un usuario con esa cédula.",
    "error.invalid_reset_token": "El enlace de recuperación es inválido o ha expirado.",
    "error.invalid_answer": "La respuesta de seguridad es incorrecta.",
    "error.duplicate_record": "Ya existe un registro con esos datos.",
    "error.cannot_delete_self": "No puede eliminar su propia cuenta.",
    "error.cannot_deactivate_self": "No puede desactivar su propia cuenta.",
    "error.company_not_found": "La empresa seleccionada no existe.",
    "error.company_in_use": "No puede eliminar la empresa porque tiene distribuidoras asociadas.",
    "error.root_permissions_readonly": "El rol Root tiene acceso total; sus permisos no pueden modificarse.",
    "error.unknown_permission": "Uno de los permisos seleccionados no es válido.",
    "error.network": "Error de conexión. Verifique su red.",
    "error.something_went_wrong": "Ocurrió un error inesperado.",
    "error.invalid_name": "El nombre debe tener entre 3 y 40 caracteres y contener solo letras.",
    "error.invalid_nick": "El nick debe tener entre 8 y 12 caracteres, con al menos una letra, un número y un carácter especial.",
    "error.invalid_password": "La contraseña debe tener entre 8 y 12 caracteres, con al menos una letra, un número y un carácter especial.",
    "error.invalid_question": "La pregunta debe tener entre 6 y 50 caracteres, con letras y números.",
    "error.invalid_cedula": "La cédula debe tener entre 7 y 8 dígitos.",
    "error.invalid_rif": "El RIF debe tener entre 7 y 12 dígitos.",
    "error.invalid_phone": "El teléfono debe tener exactamente 11 dígitos.",
    "error.password_mismatch": "Las contraseñas no coinciden.",
    "error.answer_mismatch": "Las respuestas no coinciden.",
    "error.invalid_price": "El precio no puede ser negativo.",
    "error.invalid_tax_rate": "El IVA debe estar entre 0 y 100.",
    "error.invalid_stock": "El stock no puede ser negativo.",
    "error.invalid_quantity": "La cantidad debe ser mayor a cero.",
    "error.invalid_unit_price": "El precio unitario no puede ser negativo.",
    "error.invalid_description": "La descripción no puede superar 200 caracteres.",
    "error.invalid_supplier": "El proveedor no puede superar 120 caracteres.",
    "error.invalid_client": "El cliente no puede superar 120 caracteres.",
    "error.stock_insufficient": "Stock insuficiente para realizar la venta.",
    "error.product_not_found": "El producto no existe.",
    "error.invalid_file_type": "Tipo de archivo no permitido. Use MP3, OGG, WAV o M4A.",
    "error.invalid_title": "El título es obligatorio y no puede superar 120 caracteres.",
    "error.song_not_found": "La canción no existe.",
    "error.select_product": "Seleccione un producto.",
  },

  en: {
    // App
    "app.title": "Kajataca Inventory",
    "app.brand": "Kajataca",
    "app.subtitle": "Brewery Inventory System",
    "app.logout": "Log out",
    "app.language": "Language",
    "app.unefa": "UNEFA - University Project",
    "theme.toggle": "Toggle theme",

    // Modules (menu)
    "module.operations": "Operations",
    "module.management": "Management",
    "module.reports": "Reports",
    "module.information": "Information",
    "module.inventory": "Inventory",
    "module.media": "Media",

    // Menu items
    "menu.home_view": "Dashboard",
    "menu.users_view": "Users",
    "menu.users_create": "Create Users",
    "menu.users_edit": "Edit Users",
    "menu.users_delete": "Delete Users",
    "menu.users_toggle_status": "Toggle User Status",
    "menu.companies_view": "Companies",
    "menu.companies_create": "Create Companies",
    "menu.companies_edit": "Edit Companies",
    "menu.companies_delete": "Delete Companies",
    "menu.companies_toggle_status": "Toggle Company Status",
    "menu.distributors_view": "Distributors",
    "menu.distributors_create": "Create Distributors",
    "menu.distributors_edit": "Edit Distributors",
    "menu.distributors_delete": "Delete Distributors",
    "menu.distributors_toggle_status": "Toggle Distributor Status",
    "menu.roles_manage": "Roles",
    "menu.logs_view": "Logs",
    "menu.reports_view": "Reports",
    "menu.about_view": "About",
    "menu.products_view": "Products",
    "menu.products_create": "Create Products",
    "menu.products_edit": "Edit Products",
    "menu.products_delete": "Delete Products",
    "menu.movements_view": "Movements",
    "menu.movements_create": "Create Movements",
    "menu.sales_view": "View Sales",
    "menu.sales_create": "Create Sales",
    "menu.purchases_view": "View Purchases",
    "menu.purchases_create": "Create Purchases",
    "menu.music_view": "Music",
    "menu.music_manage": "Manage Music",
    "menu.gallery_view": "Gallery",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.status": "Status",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.actions": "Actions",
    "common.search": "Search",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.name": "Name",
    "common.description": "Description",
    "common.created_at": "Created at",
    "common.add": "Add",
    "common.close": "Close",
    "common.all": "All",
    "common.confirm_delete": "Are you sure you want to delete this record?",
    "common.confirm_status": "Do you want to change the status of this record?",
    "common.loading": "Loading...",
    "common.empty": "No records",

    // Login
    "login.title": "Sign In",
    "login.user": "User",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.recover": "Change Password",
    "login.welcome": "Welcome to the Kajataca System",

    // Password recovery (3 steps)
    "rec.title": "Recover Password",
    "rec.step1_title": "Step 1: Verify ID",
    "rec.step2_title": "Step 2: Verify Answer",
    "rec.step3_title": "Step 3: New Password",
    "rec.cedula": "ID number",
    "rec.answer": "Security answer",
    "rec.new_password": "New password",
    "rec.confirm_password": "Confirm password",
    "rec.next": "Next",
    "rec.back": "Back",
    "rec.finish": "Finish",
    "rec.success": "Password updated successfully. You can now sign in.",
    "rec.step1_hint": "Enter your ID number to show the security question.",
    "rec.step2_hint": "Answer the security question to continue.",
    "rec.step3_hint": "Enter the new password (8 to 12 characters, with letters, numbers and a special character).",

    // Home
    "home.hello": "Hello!",
    "home.welcome_text": "welcome to the Kajataca System",
    "home.gallery_title": "Gallery",
    "home.about": "Brewery inventory management system, developed as a university project at UNEFA, Turén extension, Venezuela. Modernized version: Python, FastAPI and Docker.",

    // Users
    "users.title": "View Users",
    "users.name": "Full Name",
    "users.nick": "Nick",
    "users.cedula": "ID number",
    "users.password": "Password",
    "users.confirm_password": "Confirm password",
    "users.role": "User Role",
    "users.question": "Security Question",
    "users.answer": "Security Answer",
    "users.status": "Status",
    "users.add": "Create User",
    "users.edit": "Edit User",
    "users.delete": "Delete User",
    "users.toggle_status": "Toggle Status",
    "users.filter_role": "Filter by role",
    "users.filter_status": "Filter by status",
    "users.change_password_hint": "Leave the password blank to keep the current one.",

    // Companies
    "companies.title": "View Companies",
    "companies.rif": "Tax ID (RIF)",
    "companies.name": "Company Name",
    "companies.description": "Description",
    "companies.status": "Status",
    "companies.add": "Create Company",
    "companies.edit": "Edit Company",
    "companies.delete": "Delete Company",
    "companies.toggle_status": "Toggle Status",

    // Distributors
    "distributors.title": "View Distributors",
    "distributors.name": "Distributor Name",
    "distributors.phone": "Phone",
    "distributors.contact": "Contact",
    "distributors.company": "Company",
    "distributors.status": "Status",
    "distributors.add": "Create Distributor",
    "distributors.edit": "Edit Distributor",
    "distributors.delete": "Delete Distributor",
    "distributors.toggle_status": "Toggle Status",
    "distributors.filter_company": "Filter by company",

    // Logs
    "logs.title": "System Logs",
    "logs.date": "Date and Time",
    "logs.user": "User",
    "logs.event": "Event",
    "logs.description": "Description",

    // Roles
    "roles.title": "Roles and Permissions",
    "roles.name": "Role",
    "roles.description": "Description",
    "roles.permissions": "Permissions",
    "roles.manage": "Manage Permissions",
    "roles.save": "Save Permissions",
    "roles.root_note": "The Root role has full system access (no permissions required).",
    "roles.none": "No permissions assigned",

    // Reports
    "reports.title": "Reports",
    "reports.users_pdf": "Users Report (PDF)",
    "reports.generate": "Generate",
    "reports.description": "Generate the users report in PDF format.",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Inventory overview",
    "dashboard.products": "Products",
    "dashboard.low_stock": "Low stock",
    "dashboard.movements_today": "Movements today",
    "dashboard.sales_today": "Sales today",
    "dashboard.low_stock_title": "Low stock products",
    "dashboard.latest_movements_title": "Latest movements",
    "dashboard.no_low_stock": "No products with low stock.",
    "dashboard.no_movements": "No movements recorded yet.",
    "dashboard.view_products": "View products",
    "dashboard.view_movements": "View movements",

    // Products
    "products.title": "Products",
    "products.name": "Product",
    "products.company": "Company",
    "products.price": "Price",
    "products.tax_rate": "Tax %",
    "products.stock": "Stock",
    "products.add": "New Product",
    "products.edit": "Edit Product",
    "products.delete": "Delete Product",
    "products.toggle_status": "Toggle Status",
    "products.empty": "No products registered.",
    "products.stock_hint": "Stock is managed through movements.",
    "products.activate": "Activate",
    "products.deactivate": "Deactivate",

    // Movements
    "movements.title": "Movements",
    "movements.tab_purchase": "Stock In / Purchase",
    "movements.tab_sale": "Stock Out / Sale",
    "movements.tab_history": "History",
    "movements.product": "Product",
    "movements.quantity": "Quantity",
    "movements.unit_price": "Unit price",
    "movements.supplier": "Supplier (optional)",
    "movements.client": "Client (optional)",
    "movements.description": "Description (optional)",
    "movements.stock": "Stock",
    "movements.register_purchase": "Register Purchase",
    "movements.register_sale": "Register Sale",
    "movements.purchase_success": "Purchase registered successfully.",
    "movements.sale_success": "Sale registered successfully.",
    "movements.date": "Date",
    "movements.type": "Type",
    "movements.kind": "Kind",
    "movements.party": "Client / Supplier",
    "movements.user": "User",
    "movements.no_history": "No movements recorded yet.",
    "movements.no_products": "No active products available.",
    "movements.select_product": "Select a product",

    // Movement type / kind labels
    "type.in": "In",
    "type.out": "Out",
    "kind.purchase": "Purchase",
    "kind.sale": "Sale",
    "kind.adjustment": "Adjustment",

    // Gallery
    "gallery.title": "Gallery",
    "gallery.subtitle": "Store pictures",
    "gallery.kajataca": "Kajataca",
    "gallery.kajataca2": "Kajataca 2",
    "gallery.negocio": "The Business",
    "gallery.banner": "Banner",
    "gallery.anuncio": "Announcement",
    "gallery.background": "Background",

    // Music
    "music.title": "Music",
    "music.subtitle": "System songs",
    "music.song_title": "Title",
    "music.file": "Audio file",
    "music.upload": "Upload Song",
    "music.uploading": "Uploading...",
    "music.upload_success": "Song uploaded successfully.",
    "music.delete_success": "Song deleted.",
    "music.no_songs": "No songs uploaded yet.",
    "music.choose_file": "Choose an audio file",
    "music.title_required": "Enter a title",

    // Events (logs)
    "event.login": "Login",
    "event.logout": "Logout",
    "event.create_user": "User created",
    "event.edit_user": "User edited",
    "event.delete_user": "User deleted",
    "event.toggle_user_status": "User status changed",
    "event.create_company": "Company created",
    "event.edit_company": "Company edited",
    "event.delete_company": "Company deleted",
    "event.toggle_company_status": "Company status changed",
    "event.create_distributor": "Distributor created",
    "event.edit_distributor": "Distributor edited",
    "event.delete_distributor": "Distributor deleted",
    "event.toggle_distributor_status": "Distributor status changed",
    "event.change_password": "Password changed",
    "event.password_recovery": "Password recovered",
    "event.update_role_permissions": "Permissions updated",
    "event.generate_report": "Report generated",
    "event.create_product": "Product created",
    "event.edit_product": "Product edited",
    "event.delete_product": "Product deleted",
    "event.toggle_product_status": "Product status changed",
    "event.stock_in": "Stock in",
    "event.stock_out": "Stock out",
    "event.create_sale": "Sale registered",
    "event.create_purchase": "Purchase registered",
    "event.add_song": "Song added",
    "event.delete_song": "Song deleted",

    // Status
    "status.active": "Active",
    "status.inactive": "Inactive",

    // Error pages
    "error404.title": "Error 404 - Page not found",
    "error404.text": "The page you are looking for does not exist or was moved.",
    "error403.title": "Error 403 - Access denied",
    "error403.text": "You do not have enough permissions to access this section. Contact the system administrator.",
    "error505.title": "Error 505 - Internal server error",
    "error505.text": "An unexpected error occurred. Please try again later.",
    "error.back_home": "Back to Home",

    // API / validation errors
    "error.invalid_credentials": "Incorrect username or password.",
    "error.user_inactive": "This user is inactive.",
    "error.not_authenticated": "You must sign in to continue.",
    "error.forbidden": "You are not allowed to perform this action.",
    "error.not_found": "Record not found.",
    "error.validation": "The submitted data is not valid. Please review the form.",
    "error.nick_taken": "This nick is already registered.",
    "error.cedula_taken": "This ID number is already registered.",
    "error.rif_taken": "This tax ID is already registered.",
    "error.phone_taken": "This phone number is already registered.",
    "error.server": "Internal server error. Please try again.",
    "error.user_not_found": "No user found with that ID number.",
    "error.invalid_reset_token": "The recovery link is invalid or has expired.",
    "error.invalid_answer": "The security answer is incorrect.",
    "error.duplicate_record": "A record with that data already exists.",
    "error.cannot_delete_self": "You cannot delete your own account.",
    "error.cannot_deactivate_self": "You cannot deactivate your own account.",
    "error.company_not_found": "The selected company does not exist.",
    "error.company_in_use": "The company cannot be deleted because it has associated distributors.",
    "error.root_permissions_readonly": "The Root role has full access; its permissions cannot be modified.",
    "error.unknown_permission": "One of the selected permissions is not valid.",
    "error.network": "Connection error. Check your network.",
    "error.something_went_wrong": "An unexpected error occurred.",
    "error.invalid_name": "Name must be 3 to 40 characters and contain only letters.",
    "error.invalid_nick": "Nick must be 8 to 12 characters, with at least one letter, one number and one special character.",
    "error.invalid_password": "Password must be 8 to 12 characters, with at least one letter, one number and one special character.",
    "error.invalid_question": "Question must be 6 to 50 characters, with letters and numbers.",
    "error.invalid_cedula": "ID number must be 7 to 8 digits.",
    "error.invalid_rif": "Tax ID must be 7 to 12 digits.",
    "error.invalid_phone": "Phone must be exactly 11 digits.",
    "error.password_mismatch": "Passwords do not match.",
    "error.answer_mismatch": "Answers do not match.",
    "error.invalid_price": "Price cannot be negative.",
    "error.invalid_tax_rate": "Tax rate must be between 0 and 100.",
    "error.invalid_stock": "Stock cannot be negative.",
    "error.invalid_quantity": "Quantity must be greater than zero.",
    "error.invalid_unit_price": "Unit price cannot be negative.",
    "error.invalid_description": "Description cannot exceed 200 characters.",
    "error.invalid_supplier": "Supplier cannot exceed 120 characters.",
    "error.invalid_client": "Client cannot exceed 120 characters.",
    "error.stock_insufficient": "Insufficient stock to complete the sale.",
    "error.product_not_found": "Product not found.",
    "error.invalid_file_type": "File type not allowed. Use MP3, OGG, WAV or M4A.",
    "error.invalid_title": "Title is required and cannot exceed 120 characters.",
    "error.song_not_found": "Song not found.",
    "error.select_product": "Select a product.",
  },
};

let currentLang = DEFAULT_LANG;

/** Translate a key into the active language (falls back to the key). */
function t(key, fallback) {
  if (translations[currentLang] && translations[currentLang][key] !== undefined) {
    return translations[currentLang][key];
  }
  if (translations[DEFAULT_LANG] && translations[DEFAULT_LANG][key] !== undefined) {
    return translations[DEFAULT_LANG][key];
  }
  return fallback !== undefined ? fallback : key;
}

/** Fill every element carrying a data-i18n attribute. */
function applyI18n(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
}

function setLang(lang) {
  currentLang = translations[lang] ? lang : DEFAULT_LANG;
  localStorage.setItem(I18N_STORAGE_KEY, currentLang);
  document.documentElement.lang = currentLang;
  applyI18n(document);
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    const target = btn.getAttribute("data-lang-toggle");
    btn.textContent = target.toUpperCase();
  });
}

function currentLangCode() {
  return currentLang;
}

function initI18n() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  currentLang = translations[saved] ? saved : DEFAULT_LANG;
  document.documentElement.lang = currentLang;
  applyI18n(document);
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-lang-toggle");
      setLang(target);
    });
    const target = btn.getAttribute("data-lang-toggle");
    btn.textContent = target.toUpperCase();
    btn.setAttribute("aria-label", t("app.language"));
  });
}

if (typeof window !== "undefined") {
  window.KajatacaI18n = {
    t,
    applyI18n,
    setLang,
    initI18n,
    currentLangCode,
  };
}
