import matplotlib.pyplot as plt
import json
import sys

name = sys.argv[1]
input = sys.argv[2]
output = sys.argv[3]

with open(input, 'r') as file:
    data = json.load(file)

x = [r['n'] for r in list(data.values())[0]]

for r in data:
    plt.plot(x, [v['mean']/v['n'] for v in data[r]], label=r)

plt.xlabel('N')
plt.ylabel('mean')
plt.title(name)
plt.legend()

plt.tight_layout()
# plt.show()
plt.savefig(output, dpi=600)