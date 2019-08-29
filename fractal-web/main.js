function pageLoad(event) {
	console.log("Page loaded");

	document
		.querySelector("input[name=native]")
		.addEventListener('click', renderNative);

	document
		.querySelector("input[name=wasm]")
		.addEventListener('click', renderWasm);

	let theme_selector = document.querySelector("input[name=theme]");
	theme_selector.addEventListener('change', selectTheme);
	theme_selector.dispatchEvent(new Event('change'));

	let wasm_selector = document.querySelector("input[name=mandelbrot]");
	wasm_selector.addEventListener('change', selectWasm);
	wasm_selector.dispatchEvent(new Event('change'));

	window.canvas = new Canvas(document.querySelector("canvas"));
}

function renderNative(event) {
	let x = Number(document.querySelector("input[name=x]").value);
	let y = Number(document.querySelector("input[name=y]").value);
	let zoom = Number(document.querySelector("input[name=zoom]").value);

	let width = canvas.width;
	let height = canvas.height;
	let distance = 1 / (2 ** zoom);
	let max_steps = theme.max_steps;

	console.log(x, y, zoom, distance);

	for (var pixel_y = 0; pixel_y < height; pixel_y += 1) {
		for (var pixel_x = 0; pixel_x < width; pixel_x += 1) {
			let c_re = x + (pixel_x - (width/2)) * distance;
			let c_im = y + (pixel_y - (height/2)) * distance;
			var z_re = 0;
			var z_im = 0;
			var steps = 0;
			while ((z_re * z_re + z_im * z_im) < 4.0 && steps < max_steps) {
				let old_re = z_re;
				z_re = z_re * z_re - z_im * z_im + c_re;
				z_im = 2 * old_re * z_im + c_im;
				steps += 1;
			}

			let color = theme.color_pixel(steps, c_re, c_im)
			canvas.draw(pixel_x, pixel_y, color)
		}
	}

	canvas.refresh()
}

function renderWasm(event) {
	let x = Number(document.querySelector("input[name=x]").value);
	let y = Number(document.querySelector("input[name=y]").value);
	let zoom = Number(document.querySelector("input[name=zoom]").value);
	console.log("renderWasm");
	wasm.render(x, y, zoom);
	canvas.refresh()
}

function selectTheme(event) {
	window.theme = new Theme(event.target.files[0]);
}

function selectWasm(event) {
	window.wasm = new WasmRender(event.target.files[0]);
}

class Canvas {
	constructor(element) {
		this.element = element;

		let width = this.element.clientWidth - 16;
		this.element.style["box-sizing"] = "content-box";
		this.element.width = width;
		this.element.style["width"] = width;
		this.element.height = (width * 2) / 3;
		this.element.style["height"] = (width * 2) / 3;

		this.context = this.element.getContext("2d");
		this.image = this.context.createImageData(this.width, this.height);
	}

	get width() {
		return this.element.width;
	}

	get height() {
		return this.element.height;
	}

	draw(x, y, color) {
		let red = color & 0xFF;
		let green = (color >> 8) & 0xFF;
		let blue = (color >> 16) & 0xFF;
		let alpha = 0xFF;
		let index = (this.width * y + x) * 4;
		this.image.data[index + 0] = red;
		this.image.data[index + 1] = green;
		this.image.data[index + 2] = blue;
		this.image.data[index + 3] = alpha;
	}

	refresh() {
		this.context.putImageData(this.image, 0, 0);
	}
}

class WasmRender {
	constructor(file) {
		let wasm = this;

		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				let imports = WasmRender.build_imports();
				WebAssembly
					.instantiate(event.target.result, imports)
					.then((obj) => {
						console.log("WASM Mandelbrot loaded", theme);
						wasm.instance = obj.instance;
					});
			};
			reader.readAsArrayBuffer(file);
		}
	}

	render(x, y, zoom) {
		console.log(x, y, zoom);
		this.instance.exports.render(x, y, zoom);
	}

	static build_imports() {
		return {
			"env": {
				"canvas_width": () => window.canvas.width,
				"canvas_height": () => window.canvas.height,
				"draw_pixel": (x, y, color) => {
					window.canvas.draw(x, y, color);
				},
				"color_pixel": (steps, x, y) => {
					return window.theme.color_pixel(steps, x, y);
				},
				"max_steps": () => window.theme.max_steps,
			}
		};
	}
}

class Theme {
	constructor(file) {
		let theme = this;

		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				WebAssembly
					.instantiate(event.target.result, {})
					.then((obj) => {
						console.log("Theme loaded", theme);
						theme.instance = obj.instance;
					});
			};
			reader.readAsArrayBuffer(file);
		}
	}

	color_pixel(steps, x, y) {
		return this.instance.exports.color_pixel(steps, x, y);
	}

	get max_steps() {
		return this.instance.exports.max_steps();
	}
}

window.addEventListener('load', pageLoad);
