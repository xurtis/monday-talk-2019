use num::complex::Complex;

// Externally defined functions.
//
// These show up in the 'imports' for the WASM
extern "C" {
    fn canvas_width() -> u32;

    fn canvas_height() -> u32;

    fn draw_pixel(x: u32, y: u32, color: u32);

    fn color_pixel(steps: u32, x: f64, y: f64) -> u32;

    fn paint();

    fn max_steps() -> u32;

    fn progress(progress: f64);
}

#[no_mangle]
pub extern fn render(center_re: f64, center_im: f64, zoom: u32) {
    let (width, height) = canvas_dimensions();
    let distance = 1f64 / ((1u64 << zoom) as f64);

    for pixel_y in 0u32..height {
        for pixel_x in 0u32..width {
            let re = (pixel_x - width/2) as f64;
            let im = (pixel_y - height/2) as f64;
            let c = Complex::new(
                center_re + re * distance,
                center_im + im * distance,
            );
            draw_steps(pixel_x, pixel_y, c);
        }
        show_progress(pixel_y, height);
    }
    unsafe { paint(); }
}

fn draw_steps(pixel_x: u32, pixel_y: u32, c: Complex<f64>) {
    let mut z = Complex::new(0f64, 0f64);
    let mut steps = 0;
    let max_steps = unsafe { max_steps() };
    while z.norm_sqr() < 4.0 && steps < max_steps {
        z = z * z + c;
        steps += 1;
    }
    unsafe {
        draw_pixel(
            pixel_x,
            pixel_y,
            color_pixel(steps, c.re, c.im)
        );
    }
}

fn canvas_dimensions() -> (u32, u32) {
    unsafe { (canvas_width(), canvas_height()) }
}

fn show_progress(pixel_y: u32, height: u32) {
    unsafe { progress((pixel_y as f64) / (height as f64)); }
}
