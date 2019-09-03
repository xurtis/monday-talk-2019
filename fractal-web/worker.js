/*
 * Worker for rendering the mandelbrot without disrupting the UI.
 */

var image = null;
var theme = null;
var wasm = null;

// Worker message handler
onmessage = (event) => {
	switch (event.data.type) {
		case 'image':
			image = new Image(event.data.image);
			break;
		case 'theme':
			theme = new Theme(event.data.theme);
			break;
		case 'wasm':
			wasm = new WasmRender(event.data.wasm);
			break;
		case 'render_native': {
			let x = event.data.x;
			let y = event.data.y;
			let zoom = event.data.zoom;
			render_native(x, y, zoom);
			break;
		}
		case 'render_wasm':
			let x = event.data.x;
			let y = event.data.y;
			let zoom = event.data.zoom;
			wasm.render(x, y, zoom);
			break;
	}
}

function sendProgress(progress) {
	postMessage({
		"type": "progress",
		"progress": progress,
	});
}

function sendPaint(canvas) {
	postMessage({
		"type": "paint",
		"image": image.image,
	})
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
		console.log("Render @", x, y, zoom);
		this.instance.exports.render(x, y, zoom);
	}

	static build_imports() {
		return {
			"env": {
				"canvas_width": () => image.width,
				"canvas_height": () => image.height,
				"draw_pixel": (x, y, color) => {
					image.draw(x, y, color);
				},
				"color_pixel": (steps, x, y) => {
					return theme.color_pixel(steps, x, y);
				},
				"paint": () => {
					sendPaint(image.image);
				},
				"max_steps": () => theme.max_steps,
				"progress": sendProgress,
			}
		};
	}
}

class Image {
	constructor(image_data) {
		this.image = image_data;
	}

	get width() {
		return this.image.width;
	}

	get height() {
		return this.image.height;
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
}

function render_native(x, y, zoom) {
	let width = image.width;
	let height = image.height;
	let distance = 1 / (2 ** zoom);
	let max_steps = theme.max_steps;

	console.log("Render @", x, y, zoom);

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
			image.draw(pixel_x, pixel_y, color)
		}
		sendProgress(pixel_y / height);
	}

	sendPaint(image.image);
}
