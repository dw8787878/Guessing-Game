function Laptop(year, size){
  this.year = year;
  this.hd = size;
}

Laptop.prototype.checkSpecs = function(){
  return `Year: ${this.year}, HD: ${this.hd}`;
};

function Macbook(color){
  Laptop.apply(this);
  this.color = color;
}
