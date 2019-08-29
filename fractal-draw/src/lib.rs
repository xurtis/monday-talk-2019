use num::complex::Complex;

// Externally defined functions.
//
// These show up in the 'imports' for the WASM
extern "C" {
    fn canvas_width() -> u64;

    fn canvas_height() -> u64;

    fn draw_pixel(x: u64, y: u64, color: u32);

    fn color_pixel(steps: u64, x: f64, y: f64) -> u32;

    fn max_steps() -> u64;
}

#[no_mangle]
pub extern fn render(x: f64, y: f64, zoom: u32) {
    let width = unsafe { canvas_width() };
    let height = unsafe { canvas_height() };
    let distance = 1f64 / ((1u64 << zoom) as f64);
    let max_steps = unsafe { max_steps() };

    for pixel_y in 0..height {
        for pixel_x in 0..width {
            let c = Complex::new(
                x + (((pixel_x as i64) - ((width as i64)/2)) as f64) * distance,
                y + (((pixel_y as i64) - ((height as i64)/2)) as f64) * distance,
            );
            let mut z = Complex::new(0f64, 0f64);
            let mut steps = 0;
            while z.norm_sqr() < 4.0 && steps < max_steps {
                z = z * z + c;
                steps += 1;
            }
            unsafe { draw_pixel(pixel_x, pixel_y, color_pixel(steps, c.re, c.im)); }
        }
    }
}
