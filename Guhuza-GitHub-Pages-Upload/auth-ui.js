'use strict';
(()=>{
 const el=id=>document.getElementById(id);
 const password=el('authPassword'),confirmation=el('authConfirmPassword');
 function validate(){confirmation.setCustomValidity(window.guhuzaRegister&&password.value!==confirmation.value?'The passwords must match.':'');}
 function showRegistration(register){
  window.guhuzaRegister=register;
  el('authTitle').textContent=register?'Create your Guhuza account':'Sign in to Guhuza';
  el('authIntro').textContent=register?'Enter your name, email and a password to register.':'Sign in to access your interview workspace.';
  el('nameLabel').hidden=!register;el('authName').required=register;
  el('confirmLabel').hidden=!register;confirmation.required=register;
  password.autocomplete=register?'new-password':'current-password';
  password.minLength=register?10:1;
  el('passwordHelp').hidden=!register;
  el('authSubmit').textContent=register?'Create account':'Sign in';
  el('authToggle').textContent=register?'Back to sign in':'Register';
  validate();
 }
 el('authToggle').onclick=()=>{showRegistration(!window.guhuzaRegister);el(window.guhuzaRegister?'authName':'authEmail').focus();};
 password.addEventListener('input',validate);confirmation.addEventListener('input',validate);
 // Remain responsive even if account-service scripts cannot load.
 el('authForm').onsubmit=e=>{e.preventDefault();el('authMessage').textContent='Account creation and sign-in require the account service to be configured. No account has been created.';};
 showRegistration(location.hash==='#register');
})();
