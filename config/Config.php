<?php 
/*
	 
$_SESSION['nombre'] = $registro[0]['nombre'];
$_SESSION['id'] = $registro[0]['id_usuarios'];
$_SESSION['nick'] = $registro[0]['nick'];
$_SESSION['tipo'] = $registro[0]['descripcion'];
$_SESSION['id_roles'] = $registro[0]['id_roles'];
$_SESSION['autenticado'] = ENCONTRADO;
*/

	const RUTAS =  array(
		'direccion' => 'localhost/inventario/',
		'controller' => 'controlador/',
		'model' => 'modelo/',
		'vista' => 'vista/',
		'js' => 'js/',
		'css' => 'css/',
		'storage' => 'strorage/',
		'vendor' => 'vendor/',
		'ajax' => '?url='


	);

	const MODULOS = array(

		'consultar_usuario'  	   =>1, 
		'imprimir_usuario'   	   =>2,
		'agregar_usuario'    	   =>3,
		'modificar_usuario'  	   =>4,
		'desactivar_usuario' 	   =>5,

		'consultar_distribuidora'  =>6, 
		'imprimir_distribuidora'   =>7,
		'agregar_distribuidora'    =>8,
		'modificar_distribuidora'  =>9,
		'desactivar_distribuidora' =>10,

		'logs'                     =>11,

		'consultar_empresa'  		=>12, 
		'imprimir_empresa '  		=>13,
		'agregar_empresa  '   	    =>14,
		'modificar_empresa'  		=>15,
		'desactivar_empresa'       	=>16,
	

	);

	const EVENTOS = array(

		'ingresar_sistema' => 1, 
		'salir_sistema'    => 2, 
		'intento_ingresar' => 3, 
		'ingreso_a'        => 4,
		'genero_un'        => 5,
		'genero_una'       => 6,
		'modifico_un'      => 7,
		'modifico_una'     => 8,
		'cambio_un'        => 9,
		'cambio_una'       => 10,
		'abastecio'    	   => 11,
		'despacho'    	   => 12,
		'filtrado'   	   => 13,
		'genero_reporte'   => 14,
		'peticion_ajax'    => 15,
		'elimino_un'       => 16,
		'elimino_a_un'     => 17,
		'error_en'         => 18,
		'intento'          => 19,
	);



	 const USER = "root";
	 const PASS = "12345678";
	 const HOST = "localhost";
	 const DATABASE = "inventory_kajataca";

	 const ENCONTRADO = 1;
	 const NO_ENCONTRADO = -1; 

	 const ERROR = -1;
	 const OK = 1; 


	const NO_VERIFICADO = "<script>window.location.href = '?url=salir'</script>'"; 
	const VERIFICADO = 1; 



 ?>