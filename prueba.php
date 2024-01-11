<?php
// Carga la configuración 
//$config = parse_ini_file('config.ini'); 
/*
$config = array(  'username' => "armando" , 'password' => "12345678" , "dbname" => 'inventario_kajataca' );

// Conexión con los datos del 'config.ini' 
$connection = mysqli_connect('192.168.0.103',$config['username'],"12345678",$config['dbname']); 

// Si la conexión falla, aparece el error 
if($connection === false) { 
 echo 'Ha habido un error <br>'.mysqli_connect_error(); 
} else {
 echo 'Conectado a la base de datos';
}

*/

require 'config/Config.php';
require 'modelo/&Modelo.php';
require 'modelo/Usuario.php';

$modelo = new Usuario();

$json = json_encode($modelo->get_all());


$x = json_decode($json);

echo $x[0]->id_usuarios

?>


