/* The MIT License (MIT)

Copyright (c) 2015 Greg Tatum

https://github.com/gregtatum/mdn-webgl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

export const MDN = {
  multiplyPoint: function (matrix, point) {
    var x = point[0],
      y = point[1],
      z = point[2],
      w = point[3];
    var c1r1 = matrix[0],
      c2r1 = matrix[1],
      c3r1 = matrix[2],
      c4r1 = matrix[3],
      c1r2 = matrix[4],
      c2r2 = matrix[5],
      c3r2 = matrix[6],
      c4r2 = matrix[7],
      c1r3 = matrix[8],
      c2r3 = matrix[9],
      c3r3 = matrix[10],
      c4r3 = matrix[11],
      c1r4 = matrix[12],
      c2r4 = matrix[13],
      c3r4 = matrix[14],
      c4r4 = matrix[15];
    return [
      x * c1r1 + y * c1r2 + z * c1r3 + w * c1r4,
      x * c2r1 + y * c2r2 + z * c2r3 + w * c2r4,
      x * c3r1 + y * c3r2 + z * c3r3 + w * c3r4,
      x * c4r1 + y * c4r2 + z * c4r3 + w * c4r4,
    ];
  },
  multiplyMatrices: function (a, b) {
    var result = [];
    var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3],
      a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7],
      a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11],
      a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
    var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
    result[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    result[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    result[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    result[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    result[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    result[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    result[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return result;
  },
  multiplyArrayOfMatrices: function (matrices) {
    var inputMatrix = matrices[0];
    for (var i = 1; i < matrices.length; i++) {
      inputMatrix = MDN.multiplyMatrices(inputMatrix, matrices[i]);
    }
    return inputMatrix;
  },
  rotateXMatrix: function (a) {
    var cos = Math.cos;
    var sin = Math.sin;
    return [1, 0, 0, 0, 0, cos(a), -sin(a), 0, 0, sin(a), cos(a), 0, 0, 0, 0, 1];
  },
  rotateYMatrix: function (a) {
    var cos = Math.cos;
    var sin = Math.sin;
    return [cos(a), 0, sin(a), 0, 0, 1, 0, 0, -sin(a), 0, cos(a), 0, 0, 0, 0, 1];
  },
  rotateZMatrix: function (a) {
    var cos = Math.cos;
    var sin = Math.sin;
    return [cos(a), -sin(a), 0, 0, sin(a), cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },
  translateMatrix: function (x, y, z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  },
  scaleMatrix: function (w, h, d) {
    return [w, 0, 0, 0, 0, h, 0, 0, 0, 0, d, 0, 0, 0, 0, 1];
  },
};
