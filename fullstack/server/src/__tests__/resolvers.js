const resolvers = require('../resolvers');


describe('[Resolvers]', () => {
    const mockContext = {
      dataSources: {
        userAPI: { getMe: jest.fn(), login: jest.fn() },
      },
      user: { id: 0, roles:["ADMIN"] },
    };
  
    test('login', async () => {
        mockContext.dataSources.userAPI.getMe.mockReturnValueOnce(null);
        mockContext.dataSources.userAPI.login.mockReturnValueOnce({ success: true, token:"supersecrettoken"});
  
      // check the resolver response
      const res = await resolvers.Query.me(null, null, mockContext);
      expect(res).toEqual(null);
  
      // make sure the dataSources were called properly
      expect(mockContext.dataSources.userAPI.getMe).toBeCalled();
      //expect(mockContext.dataSources.userAPI.login).toBeCalledWith({ login:"user", password:"pass" });
    });
  
   
  });
  