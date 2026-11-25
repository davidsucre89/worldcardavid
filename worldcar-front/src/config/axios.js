import axios from 'axios';
import { API_URL } from '../services/api.js';

const URL_Base = axios.create({
  baseURL: API_URL,
});

export { URL_Base };
export default URL_Base;