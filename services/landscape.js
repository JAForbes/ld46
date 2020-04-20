export default function({ v, stream }){

    const viewport = stream({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: 'landscape',
        rotation: 0
    })

    const actual = stream({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: 'landscape',
        rotation: 0
    })

    const isMobile =
        Math.min( window.innerHeight, window.innerWidth ) < 600

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

        actual({
            width: window.innerWidth
            , height: window.innerHeight
            , rotation: window.screen.orientation.angle * Math.PI / 180
        })


        if(isMobile){
            try {
                if( window.innerWidth < window.innerHeight ) {
                    document.body.classList.add('enable-rotate')

                    viewport({
                        width: window.innerHeight,
                        height: window.innerWidth,
                        orientation: 'portrait',
                        rotation: 0
                    })
                } else {
                    document.body.classList.remove('enable-rotate')
                    viewport({
                        width: window.innerWidth,
                        height: window.innerHeight,
                        orientation: 'landscape',
                        rotation: 0
                    })
                }
            } catch (e) {}
        }
    }

    window.onresize = handleOrientation
    handleOrientation()
    // isMobile && window.addEventListener('orientationchange', handleOrientation)

    return { actual, viewport }
}
