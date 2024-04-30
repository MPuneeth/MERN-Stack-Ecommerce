class ApiFeatures{
    constructor(query,querystr){
        this.query=query;
        this.querystr=querystr;
    }

    search(){
        const keyword = this.querystr.keyword? {
            name:{
                $regex: this.querystr.keyword,
                $options: "i",
            },
        }
        :{};

        //console.log(keyword); 

        this.query = this.query.find({...keyword});
        return this;

    }

    filter(){
         //As querystr is already used in search method, so  
        //if given as this.querystr then queryCopy wont get quesrystr value but it will get
        //its reference only, so use spread operator(...) and assign as {...this.querystr} now 
        //it dznt hold reference but has actual copy of querystr 
        const queryCopy = {...this.querystr}
            //console.log(queryCopy);
        //Removing some fields from category
        // to define which are the things that should not include - keyword, page & limit
        //keyword is part of search so it should not come, 
        // page is like page=2 and limit is realted to page so these two should not come as well

        const removeFields = ["keyword", "page", "limit"]
        
        //to delete these 3 from queryCopy
        removeFields.forEach(key=>delete queryCopy[key]);
       
       // Filter for Price

        //console.log(queryCopy);

       let querystr = JSON.stringify(queryCopy);
       //console.log(querystr);
       querystr=querystr.replace(/\b(gt|gte|lt|lte)\b/g,(key)=> `$${key}`);

       this.query = this.query.find(JSON.parse(querystr));

       //console.log(querystr);

       return this;
   }

   pagination(resultPerPage){
    
    const currentPage = Number(this.querystr.page) || 1; 
    const skip = resultPerPage * (currentPage - 1);
     
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
   }
}
     

module.exports = ApiFeatures;