const CompositeService = require('./src/modules/tiktok/services/CompositeService')
const compositeService = new CompositeService()
async function main(){
    try{

        await compositeService.updateTikTokData('2023-10-06')
        console.log("DONE")
    }
    catch(error){
        console.log(error)
    }
}
main()