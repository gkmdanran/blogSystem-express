const pageFilter=(arr, pageNum, pageSize)=>{
    if(pageNum=='undefined'||pageSize=='undefined')return {
      list:arr,
      total:arr.length
    }
    pageNum = pageNum * 1
    pageSize = pageSize * 1
    const total = arr.length
    const pages = Math.floor((total + pageSize - 1) / pageSize)
    const start = pageSize * (pageNum - 1)
    const end = start + pageSize <= total ? start + pageSize : total
    const list = []
    for (var i = start; i < end; i++) {
      list.push(arr[i])
    }
    return {
      pageNum,
      total,
      pages,
      pageSize,
      list
    }
}
module.exports=pageFilter