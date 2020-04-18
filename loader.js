export default async function({xs, v}){

    function handleImage(path){
        return new Promise( Y => {
            const img = new Image()
            img.onload = () => {
                Y(img)
            }
            img.src = path
        })
    }

    function handleJSON(path){
        return v.request(path)
    }

    function handleWAV(path){
        return new Promise( (Y,N) => {
            const snd = new Audio()
            snd.addEventListener('canplay', () => {
                const oldVolume = snd.volume
                snd.volume = 0
                snd.play().then(
                    () => {
                        snd.pause()
                        snd.currentTime = 0
                        snd.volume = oldVolume
                        Y(snd)
                    }
                    , N
                )
            }, { once: true })
            snd.src = path
        })
    }

    const recognized = {
        'wav': handleWAV,
        'json': handleJSON,
        'png': handleImage
    }

    return Promise.all(
        xs.map(
            x => {
                const type = x.split('.').slice(-1)
                if( type in recognized) {
                    return recognized[type](x)
                } else {
                    return Promise.reject( new Error('Could not load filetype '+type+' for file '+x) )
                }
            }
        )
    )
}