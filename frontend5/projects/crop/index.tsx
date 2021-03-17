import { h, render } from 'preact';
import 'preact/devtools';
//import styles from './index.module.css'

const root = document.getElementById('root')

function App() {
    return <div class={"foo"}>Crop - Hi!</div>
}

if (root) {
    render(<App />, root);
}

export default () => console.log('what??');
