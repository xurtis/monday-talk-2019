//! Simple theming function for the fractal generator

/// The number of steps to render
pub type Steps = u64;

/// A point in the cartesian plane of reals
#[repr(C)]
pub struct Point {
    x: f64,
    y: f64,
}

/// A 24-bit color
#[repr(C)]
pub struct Color {
    red: u8,
    green: u8,
    blue: u8,
}

impl Into<u32> for Color {
    fn into(self) -> u32 {
        let Color { red, green, blue } = self;
        (red as u32) | ((green as u32) << 8) | ((blue as u32) << 16)
    }
}

#[no_mangle]
pub extern fn color_pixel(steps: u64, x: f64, y: f64) -> u32 {
    color_pixel_impl(steps, Point { x, y }).into()
}

#[no_mangle]
pub extern fn max_steps() -> u64 {
    max_steps_impl()
}

macro_rules! themes {
    {$([$name:expr; $steps:expr] = $value:expr);*$(;)*} => {
        fn color_pixel_impl(steps: Steps, point: Point) -> Color {$(
            #[cfg(feature = $name)]
            {$value(steps, point)}
        )*}

        fn max_steps_impl() -> u64 {$(
            #[cfg(feature = $name)]
            {$steps}
        )*}
    };
}

themes!{
    ["simple"; 256] = |steps, _| {
        let level = steps as u8;
        Color { red: level, green: level, blue: level }
    };
    ["red"; 256] = |steps, _| {
        let level = steps as u8;
        Color { red: level, green: 0, blue: 0 }
    };
    ["green"; 256] = |steps, _| {
        let level = steps as u8;
        Color { red: 0, green: level, blue: 0 }
    };
    ["blue"; 256] = |steps, _| {
        let level = steps as u8;
        Color { red: 0, green: 0, blue: level }
    };
    ["position"; 256] = |steps, Point {x, y}| {
        let red = ((x.abs() * 256.0) / 2.0) as u8;
        let blue = ((y.abs() * 256.0) / 2.0) as u8;
        let green = steps as u8;
        Color { red, green, blue }
    };
    ["demo"; 256] = |steps, Point {x, y}| {
        let steps = steps as u8;
        let red = unimplemented!();
        let blue = unimplemented!();
        let green = unimplemented!();
        Color { red, green, blue }
    };
}
