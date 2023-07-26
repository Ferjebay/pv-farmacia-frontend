import axios from 'axios'
import { useAuthUserStore } from "stores/auth-user"
import JWT from 'jwt-client'

const authUserStore = useAuthUserStore();

const Api = axios.create({
 	baseURL: import.meta.env.VITE_BASE_URL,
  headers: {'Content-Type': 'application/json'}
});

Api.interceptors.request.use(function(config){
	let token = JSON.parse(localStorage.getItem('auth/user'));

  // console.log( token );
  // console.log( token );
  // if ( !token ) {
    // if(token.token != null){
    //   const { claim: {exp} } = JWT.read(authUserStore.token);

    //   const expira = exp * 1000
    //   const now = Date.now()
    //   const diff = (expira - now) / 1000
    //   if ( diff < 1 ){
    //     authUserStore.$reset();
    //     window.location = '/login'
    //   }
      token =  token != null ? token.token : '';
    // }
  // }

	config.headers.Authorization = token ? `${token}` : '';
	return config;
});

export default Api;
