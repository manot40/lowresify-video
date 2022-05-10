export default class BlobStore {
  _blob = null;
  constructor() {
    let url;
    /**
     * 
     * @param {BlobPart[]} blob 
     * @param {BlobPropertyBag} options 
     */
    this.setBlob = function (blob, options) {
      this._blob = new Blob(blob, options);
    }
    this.getURL = function () {
      if (url) return url;
      return (url = URL.createObjectURL(this._blob));
    };
    this.dispose = function () {
      if (url)
        (url = URL.revokeObjectURL(url)), undefined;
      this.blob = null;
    };
  }
}