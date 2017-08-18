function GetGroupedDataByCategoryandUnit(initialData)
{
     
      var nestedData = d3.nest().key(function(d){ return d.unit; })
                               .rollup(function(leaves){ 
                                          return leaves.length;
                         }).entries(initialData);

      return nestedData;
}