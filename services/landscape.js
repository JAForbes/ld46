export default function({ v }){

    v.css.css('body.enable-rotate', `
        transform: rotate(-90deg);
        transform-origin: left top;
        width: 100vh;
        height: 100vw;
        overflow-x: hidden;
        position: absolute;
        top: 100%;
        left: 0;
    `)

    const handleOrientation = () => {

        try {
            if( window.innerWidth < window.innerHeight ) {
                document.body.classList.add('enable-rotate')
            } else {
                document.body.classList.remove('enable-rotate')
            }
        } catch (e) {}
    }

    window.onresize = handleOrientation
    window.addEventListener('orientationchange', handleOrientation)
    handleOrientation()
}
