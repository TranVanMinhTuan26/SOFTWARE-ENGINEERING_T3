import 'reflect-metadata';
import { ApiController } from './tasks/task-02-san-pham/san-pham.controller';
import { prisma } from './tasks/task-01-khoi-tao/ket-noi-prisma';

describe('API-T01/02 menu controller (repository isolated)', () => {
  afterEach(() => jest.restoreAllMocks());
  const item={id:'p1',name:'Coffee',description:'Coffee',category:'Coffee',price:45000,imageUrl:'',active:true,createdAt:new Date(),productToppings:[]};
  it('returns available products and hides inactive toppings', async () => {
    jest.spyOn(prisma.product,'findMany').mockResolvedValue([{...item,productToppings:[{topping:{id:'t',name:'extra',price:7000,active:false}}]}] as any);
    const controller=new ApiController({getProductAvailability:async()=>new Map([['p1',true]])} as any);
    expect(await controller.products()).toEqual([expect.objectContaining({id:'p1',available:true,toppings:[]})]);
  });
  it('returns empty menu without fabricating products', async () => {
    jest.spyOn(prisma.product,'findMany').mockResolvedValue([]);
    const controller=new ApiController({getProductAvailability:async()=>new Map()} as any);
    expect(await controller.products()).toEqual([]);
  });
  it('marks unavailable product and returns 404 for a missing id', async () => {
    jest.spyOn(prisma.product,'findFirst').mockResolvedValueOnce(item as any).mockResolvedValueOnce(null);
    const controller=new ApiController({getProductAvailability:async()=>new Map([['p1',false]])} as any);
    expect(await controller.product('p1')).toEqual(expect.objectContaining({available:false,stock:0}));
    await expect(controller.product('missing')).rejects.toMatchObject({status:404});
  });
});
