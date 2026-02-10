import { createStore } from 'vuex';

const savedToken = localStorage.getItem('token') || '';
const savedUser  = JSON.parse(localStorage.getItem('user') || 'null');

export default createStore({
  // 全局状态
  state:{ token: savedToken, user: savedUser },
  mutations:{
    // 写入登录态
    setAuth(state, { token, user }){
      state.token = token; state.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user||null));
    },
    // 退出
    logout(state){ state.token=''; state.user=null; localStorage.removeItem('token'); localStorage.removeItem('user'); }
  }
});