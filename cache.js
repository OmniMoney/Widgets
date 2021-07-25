class Cache {
  constructor(name){
    this.fm = FileManager.iCloud();
    this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), name);
    
    if ( !this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath);
   }      
  }
  
  read = async(key, expirationHours) => {
    try {
      const path = this.fm.joinPath(this.cachePath, key);
      await this.fm.downloadFileFromiCloud(path);
      const createdAt = this.fm.creationDate(path);
      
      if ( expirationHours ) {
        if (( new Date()) - createdAt > (expirationHours * 3600000 )) {
          this.fm.remove(path);
          return null;
        } 
      }
      
      const value = this.fm.readString(path);
      
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    } catch (error) {
      return null;
    }
  }
  
  write = (key, value) => {
    const path = this.fm.joinPath(this.cachePath, key.replace('/', "-"));
    console.log(`Caching to ${path}...`);
    
    if ( typeof value === "string" || value instanceof String) {
      this.fm.writeString(path, value);
    } else {
      this.fm.writeString(path, JSON.stringify(value));
    }
  }
};

module.exports = Cache;
