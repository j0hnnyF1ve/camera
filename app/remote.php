<?php
error_reporting(E_ALL);
require 'phpmailer/PHPMailerAutoload.php';

$op = $_GET['op'];
switch($op)
{
    case 'sendEmail':
      $validationResponse = validateEmail($_POST);
      if( $validationResponse['success'] == true)
      {
        sendEmail($_POST);
      }
      else
      {
        $response = $validationResponse;
      }
      break;
    case 'sendEmailWithAttachment':
      $validationResponse = validateEmail($_POST);
      if( $validationResponse['success'] == true)
      {
        sendEmailWithAttachment($_POST);
      }
      else
      {
        $response = $validationResponse;
      }
      break;
    default:
      $response = createMessage(false, 'A valid operation ID was not supplied');
      break;
}
if(!empty($response))
{
   echo createJsonMessage($response['success'], $response['message'], $response['data']);  
}

function validateEmail($inputs)
{
  $validEmail = true;
  $message = '';
  $data = array();
  foreach($inputs as $key => $value)
  {
    if(empty($value) || strlen($value) <= 0)
    {
      $validEmail = false;
      array_push($data, 'The "'.ucfirst($key).'" field is required.');
    }
    switch($key)
    {
      case 'email':
        if(preg_match('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i', $value) < 1)
        {
          $validEmail = false;
          array_push($data, "Email address supplied is invalid");
        }
        break;
      default:
        break;
    }
  }
  if(!empty($data))
  {
    $message = 'The following fields have errors';
  }


  return createMessage( $validEmail, $message, $data );
}

function sendEmail($inputs)
{
  $name = $inputs['name'];
  $email = strtolower($inputs['email']);
  $subject = $inputs['subject'];
  $message = $inputs['message'];

  $to = $inputs['to'];
  $addlHeaders  = 'From: "'.$name.'" <'.$email.'>' .chr(10);
  $addlHeaders .= 'From: "'.$name.'" <'.$email.'>';

  if( mail($to, $subject, $message, $addlHeaders) )
  {
    echo createJsonMessage(true, 'Your Message has been sent');  
  }
  else
  {
    echo createJsonMessage(false, 'There was a problem sending your message.');  
  }
}

function sendEmailWithAttachment($inputs) {
  $name = $inputs['name'];
  $email = strtolower($inputs['email']);
  $subject = $inputs['subject'];
  $message = $inputs['message'];
  $in_attachment = $inputs['attachment'];
  $filename = $inputs['filename'] || "image.png";

  $to = $inputs['to'];
  $addlHeaders  = 'From: "'.$name.'" <'.$email.'>' .chr(10);

  // requires php5
  define('UPLOAD_DIR', 'tmp/');
  $img = $in_attachment;
  $img = str_replace('data:image/png;base64,', '', $img);
  $img = str_replace(' ', '+', $img);
  $data = base64_decode($img);
  $file = UPLOAD_DIR . uniqid() . '.png';
  $success = file_put_contents($file, $data);

  if(!$success) { 
    echo createJsonMessage(false, 'Problem uploading image' );  
    exit;
  }

  $mail = new PHPMailer;

  $mail->isSMTP();                                      // Set mailer to use SMTP
  $mail->SMTPAuth = true; // enable SMTP authentication
  $mail->SMTPSecure = "ssl"; // sets the prefix to the servier
  $mail->Host = "box398.bluehost.com"; // sets the SMTP server
  $mail->Port = 465; // set the SMTP port for the GMAIL server
  $mail->Username = "test@aroadalittlelesstraveled.com"; // SMTP account username
  $mail->Password = "911j0hn!"; // SMTP account password
  
  $mail->From = $email;
  $mail->FromName = $name;

  $mail->addAddress($to);               // Name is optional

  $mail->WordWrap = 50;                                 // Set word wrap to 50 characters
  $mail->addAttachment($file, $filename);         // Add attachments
  $mail->isHTML(true);                                  // Set email format to HTML

  $mail->Subject = $subject;
  $mail->Body    = $message;
  $mail->AltBody = $message;

  try{
    if(!$mail->send()) {
       echo createJsonMessage(false, 'There was a problem sending your message.', array('error' => $mail->ErrorInfo) );  
       exit;
    }
  }
  catch(Exception $e) {
    echo createJsonMessage(false, 'Mail Exception Error.', array('error' => print_r($e, true) ) );  
  }

  echo createJsonMessage(true, 'Your Message has been sent');  
}


// createMessage creates a specific formatted array for use throughout the server
// success is a boolean (true or false) indicating if the operation was successful
// message is an optional message to display to the user
// data is an array containing data to be passed back
function createMessage($success, $message = '', $data = array())
{
  return array('success' => $success, 'message' => $message, 'data' => $data);
}

// createJsonMessage takes a specific formatted array for use throughout the server, and outputs a json encoded string
// success is a boolean (true or false) indicating if the operation was successful
// message is an optional message to display to the user
// data is an array containing data to be passed back
function createJsonMessage($success, $message = '', $data = array() )
{
  return json_encode(createMessage($success, $message, $data) );
}

?>