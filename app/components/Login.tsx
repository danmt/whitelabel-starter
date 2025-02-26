'use client';
import {useLoginWithEmail} from '@privy-io/react-auth';
import {useEffect, useState} from 'react';

const Login = () => {
  /**
   * Logic for using whitelabel email auth
   *
   */
  const {
    sendCode: sendCodeEmail,
    loginWithCode: loginWithCodeEmail,
    state: stateEmail,
  } = useLoginWithEmail({
    onComplete: ({user, isNewUser, wasAlreadyAuthenticated, loginMethod}) => {
      console.log('🔑 ✅ User successfully logged in with email', {
        user,
        isNewUser,
        wasAlreadyAuthenticated,
        loginMethod,
      });
    },
    onError: (error) => {
      console.log(error);
    },
  });

  // Email Local State
  const [email, setEmail] = useState('');
  const [codeEmail, setCodeEmail] = useState('');
  const [emailState, setEmailState] = useState(stateEmail.status as string);

  // Update email status
  useEffect(() => {
    if (stateEmail.status === 'error' && stateEmail.error) {
      const message = `Error ${stateEmail.error.message}`;
      setEmailState(message);
    } else {
      setEmailState(stateEmail.status);
    }
  }, [stateEmail]);

  return (
    <div className="mx-4 px-4">
      <h2 className="text-2xl font-bold text-center my-4">Authentication</h2>
      <div className="text-center mt-4 mx-auto mb-4">
        <p className="status-text">We use Privy to empower users to authenticate through Email.</p>
      </div>
      <div className="mt-4 p-4">
        <div className="flex flex-col">
          <div>
            <h2 className="text-xl font-bold mb-4 text-left">Email</h2>
            <input
              className="input mb-2 flex-grow"
              placeholder="Enter email"
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <button
              onClick={() => sendCodeEmail({email})}
              className="btn wallet-button-primary mb-2"
              disabled={emailState === 'sending-code'}
            >
              <div className="btn-text">Send code</div>
            </button>
            <input
              className="input mb-2 flex-grow"
              placeholder="Enter OTP"
              onChange={(e) => setCodeEmail(e.currentTarget.value)}
            />
            <button
              onClick={() => loginWithCodeEmail({code: codeEmail})}
              className={`btn ${emailState === 'initial' ? 'btn-disabled' : 'wallet-button-primary'} mb-2`}
              disabled={emailState === 'initial'}
            >
              <div className={`${emailState === 'initial' ? 'btn-text-disabled' : 'btn-text'}`}>
                Login
              </div>
            </button>
            <p className="status-text">Status: {emailState}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
