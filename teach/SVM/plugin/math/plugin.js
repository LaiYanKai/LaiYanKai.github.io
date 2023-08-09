import {KaTeX} from "./katex";
import {MathJax3} from "./mathjax3";

const defaultTypesetter = KaTeX;

/*!
 * This plugin is a wrapper for the MathJax2,
 * MathJax3 and KaTeX typesetter plugins.
 */
export default Plugin = Object.assign( defaultTypesetter(), {
	KaTeX,
	MathJax3
} );