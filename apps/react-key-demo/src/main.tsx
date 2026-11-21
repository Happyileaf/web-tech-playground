import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

// 直接挂载根组件（不使用 StrictMode 双重挂载），以确保实验中的 DOM 实例编号与卸载/挂载统计真实对应列表协调行为
createRoot(document.getElementById('root')!).render(<App />);
