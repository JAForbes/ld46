export default function({ v, stream }){

    const viewport = stream({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: 'landscape'
    })

    const actual = stream({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: 'landscape'
    })

    v.css.css('body.enable-rotate', `
        transform: rotate(-90deg);
        transform-origin: left top;
        width: 100vh;
        height: 100vw;
        overflow-x: hidden;
        position: absolute;
        top: 100%;
        left: 0;
        --viewport-width: 100vh;
        --viewport-height: 100vw;
    `)

    v.css.css('body', `
        --viewport-width: 100vw;
        --viewport-height: 100vh;
    `)

    const handleOrientation = () => {

        actual({ width: window.innerWidth, height: window.innerHeight })

        try {
            if( window.innerWidth < window.innerHeight ) {
                document.body.classList.add('enable-rotate')

                viewport({
                    width: window.innerHeight,
                    height: window.innerWidth,
                    orientation: 'portrait'
                })
                v.redraw()
            } else {
                document.body.classList.remove('enable-rotate')
                viewport({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    orientation: 'landscape'
                })
                v.redraw()
            }
        } catch (e) {}
    }

    window.onresize = handleOrientation
    // window.addEventListener('orientationchange', handleOrientation)
    handleOrientation()

    return { actual, viewport }
}
