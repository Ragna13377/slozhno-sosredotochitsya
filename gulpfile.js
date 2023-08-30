//TODO: картинки прожать попробуй
const gulp = require('gulp');
const fs = require('fs');
const del = require('del');
const gulpIf  = require('gulp-if');
const plumber = require('gulp-plumber');
const fileInclude = require('gulp-file-include');
const htmlMinifier = require('html-minifier');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat-css');
const postCss = require('gulp-postcss');
const cssnano = require('cssnano'); //gulp-clean-css
const autoprefixer = require('autoprefixer'); //gulp-autoprefixer
const postCssCombineMediaQuery = require('postcss-combine-media-query'); //gulp-group-css-media-queries
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const browserSync = require('browser-sync').create();

let isBuild = process.argv.includes('--build');

const plugins = [
    autoprefixer({
        grid: true,
        cascade: true
    }),
    postCssCombineMediaQuery(),
    cssnano()
];
const options = {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    minifyCSS: true,
    keepClosingSlash: true
};

let srcFolder = '.';
let distFolder = './dist';

let path = {
    dest: {
        html: `${distFolder}/`,
        css: `${distFolder}/styles/`,
        js: `${distFolder}/scripts/`,
        images: `${distFolder}/images/`,
        fonts: `${distFolder}/fonts/`
    },
    src: {
        html: `${srcFolder}/*.html`,
        scss: `${srcFolder}/styles/**/*.scss`,
        font_style: `${srcFolder}/fonts/fonts.scss`,
        css: [`${srcFolder}/**/*.css`, `!${srcFolder}/**/fonts.css`],
        js: `${srcFolder}/scripts/**/*.js`,
        images: `${srcFolder}/images/**/*.{avif,webp,svg,ico,gif,png,jpg}`,
        fonts: `${srcFolder}/fonts`,
    },
    watch: {
        html: `${srcFolder}/**/*.html`,
        scss: `${srcFolder}/styles/**/*.scss`,
        font_style: `${srcFolder}/fonts/fonts.scss`,
        css: `${srcFolder}/**/*.css`,
        js: `${srcFolder}/scripts/**/*.js`,
        images: `${srcFolder}/images/**/*.{avif,webp,svg,ico,gif,png,jpg}`,
    },
    clean: `./${distFolder}/`
}

const font = gulp.series(otfToTtfAndWoff, ttfToWoff2, fontsStyle);
const build = gulp.series(fonts, font_style, gulp.parallel(html, scss, js, images));
const watch = gulp.series(clean, build, gulp.parallel(watchFiles, server));

function server(params) {
    browserSync.init({
        server: {
            baseDir: `${path.dest.html}`
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(fileInclude())
        .pipe(replace(/((?:src|srcset)=")(?:\.\.\/)+(images\/(?:(?:\w+\/)+)?\w+(?:.avif|.webp|.svg|.gif|.png|.jpg)")/gi, '$1./$2'))
        .on('data', function(file){
            if(isBuild){
                const buferFile = Buffer.from(htmlMinifier.minify(file.contents.toString(), options))
                return file.contents = buferFile
            }
        })
        .pipe(gulp.dest(path.dest.html))
        .pipe(browserSync.stream())
}

//compressed/expanded
function scss() {
    return gulp.src(path.src.scss, {})
        .pipe(plumber())
        .pipe(replace(/(url\((?:'|")?)(?:\.\.\/)+(images\/(?:(?:\w+\/)+)?\w+(?:.avif|.webp|.svg|.gif|.png|.jpg)(?:'|")?\))/gi, '$1../$2'))
        .pipe(sass({
            outputStyle: "expanded"
        }))
        .pipe(gulpIf(isBuild, postCss(plugins)))
        .pipe(gulp.dest(path.dest.css))
        .pipe(browserSync.stream())
}

function font_style(){
    return gulp.src(path.src.font_style, {})
        .pipe(plumber())
        .pipe(sass({
            outputStyle: "expanded"
        }))
        .pipe(gulp.dest(path.dest.fonts))
        .pipe(browserSync.stream())
}

function css() {
    return gulp.src(path.src.css, {})
        .pipe(plumber())
        .pipe(concat('bundle.css'))
        .pipe(gulpIf(isBuild, postCss(plugins)))
        .pipe(gulp.dest(path.dest.css))
        .pipe(browserSync.stream())
}

function js(){
    return gulp.src(`${path.src.js}`)
        .pipe(gulp.dest(`${path.dest.js}`))
}

function images() {
    return gulp.src(`${path.src.images}`)
        .pipe(gulp.dest(`${path.dest.images}`))
}

function fonts() {
    return gulp.src(`${srcFolder}/fonts/*.{ttf,otf,woff,woff2,svg}`)
        .pipe(gulp.dest(path.dest.fonts))
}

function otfToTtfAndWoff() {
    return gulp.src(`${path.src.fonts}/*.otf`, {})
        .pipe(plumber())
        .pipe(fonter({
            formats: ['ttf', 'woff']
        }))
        .pipe(gulp.dest(`${path.src.fonts}`))
}

function ttfToWoff2(){
    return gulp.src(`${path.src.fonts}/*.ttf`)
        .pipe(plumber())
        .pipe(ttf2woff2())
        .pipe(gulp.dest(path.src.fonts))
}

function fontsStyle(){
    let fontsFile = path.src.font_css;
    fs.readdir(path.dest.fonts, function (err, fontsFiles){
        if(fontsFiles) {
            if(!fs.existsSync(fontsFile)) {
                fs.writeFile(fontsFile, '', cb);
                let newFileOnly;
                for(let i = 0; i < fontsFiles.length; i++){
                    let fontFileName = fontsFiles[i].split('.')[0];
                    if(newFileOnly !== fontFileName) {
                        let fontName = fontFileName.split('-')[0] ? fontFileName.split('-')[0] : fontFileName;
                        let fontWeight = fontFileName.split('-')[1] ? fontFileName.split('-')[1] : fontFileName;
                        switch (fontWeight.toLowerCase()){
                            case 'thin':
                                fontWeight = 100;
                                break;
                            case 'extralight':
                                fontWeight = 200;
                                break;
                            case 'light':
                                fontWeight = 300;
                                break;
                            case 'regular':
                                fontWeight = 400;
                                break;
                            case 'medium':
                                fontWeight = 500;
                                break;
                            case 'semibold':
                                fontWeight = 600;
                                break;
                            case 'bold':
                                fontWeight = 700;
                                break;
                            case 'extrabold':
                                fontWeight = 800;
                                break;
                            case 'black':
                                fontWeight = 900;
                                break;
                            default:
                                fontWeight = 400;
                        }
                        fs.appendFile(fontsFile, `@font-face {\n\tfont-family: ${fontName};\n\tfont-display: swap;\n\tsrc: url(../fonts/${fontFileName}.woff2) format("woff2"), url(../fonts/${fontFileName}.woff) format("woff"), url(../fonts/${fontFileName}.ttf) format("truetype"), url(../fonts/${fontFileName}.otf) format("opentype");\n\tfont-weight: ${fontWeight};\n\t}\r\n`,function(){});
                        newFileOnly = fontFileName;
                    }
                }
            }
        }
    });
    return gulp.src(`${srcFolder}`);
    function cb(){}
}

function clean() {
    return del('dist');
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.scss], scss);
    gulp.watch([path.watch.font_style], font_style);
    // gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.images], images);
}

exports.font = font;
exports.build = build;
exports.watch = watch;
exports.default = watch;