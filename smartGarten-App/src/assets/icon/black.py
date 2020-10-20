import cv2
import numpy as np

img = cv2.imread('ph.png')
b,g,r = cv2.split(img)
b = (b == 0).astype(int) *255
b = b.astype(g.dtype)
img = cv2.merge([b,b,b])
cv2.imwrite('ph1.png',img)